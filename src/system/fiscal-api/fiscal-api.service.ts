import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { lastValueFrom } from 'rxjs'
import { gzipSync, gunzipSync } from 'zlib'
import { parseStringPromise } from 'xml2js'
import { encode } from 'iconv-lite'
import { readFileSync } from 'fs'
import { createPrivateKey } from 'crypto'
import { SignedXml } from 'xml-crypto'
import { ConfigService } from '@nestjs/config'
import { Environment } from '../../env.validation'

@Injectable()
export class FiscalApiService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private readonly apiUrl = 'https://fs.tax.gov.ua:8643/fs'
  private isTesting =
    this.configService.getOrThrow<Environment>('NODE_ENV') ===
    Environment.Production
      ? false
      : true

  async checkServerState(): Promise<{ timestamp: string; uid: string }> {
    const uid = crypto.randomUUID()
    const command = { Command: 'ServerState', UID: uid }

    try {
      const response = await this.sendCommand(command)
      return {
        timestamp: response.Timestamp,
        uid: response.UID,
      }
    } catch (error) {
      console.error('Error checking server state:', error)
      throw error
    }
  }

  private async signXmlDocument(
    xmlDocument: string,
    secretKeyPath: string,
    passphrase: string,
  ): Promise<string> {
    const keyData = readFileSync(secretKeyPath)

    const privateKey = createPrivateKey({
      key: keyData,
      format: 'der',
      type: 'pkcs8',
      passphrase,
    })

    const sig = new SignedXml({
      privateKey: privateKey.export({ format: 'pem', type: 'pkcs8' }),
    })
    sig.addReference({
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
    })
    sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#'
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
    sig.computeSignature(xmlDocument)

    return sig.getSignedXml()
  }

  private async sendDocument(
    xmlDocument: string,
    useCompression: boolean = true,
  ) {
    const endpoint = `${this.apiUrl}/doc`
    const headers = this.getHeaders(useCompression, true)
    const body = this.prepareBody(xmlDocument, useCompression)

    return this.sendRequest(endpoint, headers, body, 'command')
  }

  private async sendPacket(
    xmlDocument: string,
    useCompression: boolean = true,
  ) {
    const endpoint = `${this.apiUrl}/pck`
    const headers = this.getHeaders(useCompression, true)
    const body = this.prepareBody(xmlDocument, useCompression)

    return this.sendRequest(endpoint, headers, body, 'packet')
  }

  private async sendCommand(
    jsonCommand: object,
    useCompression: boolean = false,
  ) {
    const endpoint = `${this.apiUrl}/cmd`
    const headers = this.getHeaders(useCompression, false)
    const body = this.prepareBody(JSON.stringify(jsonCommand), useCompression)

    return this.sendRequest(endpoint, headers, body, 'command')
  }

  private getHeaders(useCompression: boolean, isXmlPayload: boolean) {
    const headers = {
      'Content-Type': isXmlPayload
        ? 'application/octet-stream'
        : 'application/json; charset=UTF-8',
    }

    if (useCompression) {
      headers['Content-Encoding'] = 'gzip'
    }

    return headers
  }

  private prepareBody(payload: string, useCompression: boolean) {
    const encodedPayload = encode(payload, 'win1251')

    if (useCompression) {
      return gzipSync(encodedPayload)
    }

    return encodedPayload
  }

  private async sendRequest(
    endpoint: string,
    headers: any,
    body: Buffer,
    type: 'document' | 'command' | 'packet',
  ): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(endpoint, body, { headers }),
      )

      if (response.headers['content-encoding'] === 'gzip') {
        const uncompressedBody = gunzipSync(response.data).toString()
        if (type === 'command') {
          return uncompressedBody
        } else {
          return parseStringPromise(uncompressedBody)
        }
      }

      if (type === 'command') {
        return response.data
      } else {
        return parseStringPromise(response.data.toString())
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message)
      throw error
    }
  }
}
