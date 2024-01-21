import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

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

  async uploadFile(Key: string, Body: Buffer) {
    await this.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key,
        Body,
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
}
