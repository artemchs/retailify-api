import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  HeadObjectCommandInput,
  ListObjectsCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import { GeneratePresignedPutUrlDto } from './dto/generate-presigned-put-url.dto'
import { ReadStream } from 'fs'

@Injectable()
export class StorageService extends S3Client {
  constructor(private configService: ConfigService) {
    super({
      forcePathStyle:
        configService.getOrThrow<string>('NODE_ENV') === 'test' ? true : false,
      endpoint:
        configService.getOrThrow<string>('NODE_ENV') === 'test'
          ? 'http://s3.localhost.localstack.cloud:4566'
          : undefined,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('AWS_S3_ACCESS_KEY'),
        secretAccessKey: configService.getOrThrow<string>(
          'AWS_S3_SECRET_ACCESS_KEY',
        ),
      },
      region: configService.getOrThrow<string>('AWS_S3_REGION'),
    })
  }

  private readonly bucketName =
    this.configService.getOrThrow<string>('NODE_ENV') === 'test'
      ? 'test'
      : this.configService.getOrThrow('AWS_S3_BUCKET_NAME')

  async uploadFile(
    Key: string,
    Body: Buffer | ReadStream,
    ContentType?: string,
  ) {
    await this.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key,
        Body,
        ContentType,
      }),
    )
  }

  async deleteFile(Key: string) {
    await this.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key,
      }),
    )
  }

  async deleteFiles(Keys: string[]) {
    if (Keys.length >= 1) {
      await this.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: Keys.map((Key) => ({ Key })),
          },
        }),
      )
    }
  }

  getFileUrl(Key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key })
    return getSignedUrl(this, command)
  }

  async reset() {
    const environment = this.configService.get<string>('NODE_ENV')

    if (environment === 'test') {
      const { Contents } = await this.send(
        new ListObjectsCommand({ Bucket: this.bucketName }),
      )

      if (Contents && Contents.length >= 1) {
        return this.send(
          new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: Contents?.map(({ Key }) => ({ Key })),
            },
          }),
        )
      }
    }
  }

  async generatePresignedGetUrl(key: string) {
    const params: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
    }

    const command = new GetObjectCommand(params)
    const url = await getSignedUrl(this, command)

    return url
  }

  async generatePresignedPutUrl({ dir }: GeneratePresignedPutUrlDto) {
    const key = `${dir}/${randomUUID()}`

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
    }

    const command = new PutObjectCommand(params)
    const url = await getSignedUrl(this, command)

    return {
      url,
      key,
    }
  }

  getHeader(key: string) {
    try {
      const params: HeadObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
      }
      const command = new HeadObjectCommand(params)

      return this.send(command)
    } catch (e) {
      console.error('Error in "storage.getHeader": ', e)
    }
  }

  getObject(key: string) {
    try {
      const params: GetObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
      }
      const command = new GetObjectCommand(params)

      return this.send(command)
    } catch (e) {
      console.error('Error in "storage.getObject": ', e)
    }
  }

  listObjects() {
    const params: ListObjectsV2CommandInput = {
      Bucket: this.bucketName,
    }
    const command = new ListObjectsV2Command(params)

    return this.send(command)
  }
}
