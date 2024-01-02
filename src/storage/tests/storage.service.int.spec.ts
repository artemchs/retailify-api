import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { StorageService } from '../storage.service'
import { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'

describe('StorageService (int)', () => {
  let storage: StorageService
  const bucketName = 'test'

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    storage = moduleRef.get(StorageService)

    await storage.reset()
  })

  afterEach(async () => await storage.reset())

  describe('Upload file', () => {
    it('should successfully upload a new file to the storage', async () => {
      const body = Buffer.from('Hello World!')
      await storage.uploadFile('test.txt', body)

      const { Contents } = await storage.send(
        new ListObjectsV2Command({ Bucket: bucketName }),
      )

      expect(Contents?.length).toBe(1)
    })
  })

  describe('Get file url', () => {
    beforeEach(async () => {
      await storage.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: 'test.txt',
          Body: 'Hello World!',
        }),
      )
    })

    it('should successfully get the presigned url of the file', async () => {
      const url = await storage.getFileUrl('test.txt')

      expect(url).toBeDefined()
      expect(url).not.toBeNull()
    })
  })

  describe('Reset', () => {
    beforeEach(async () => {
      await storage.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: 'test.txt',
          Body: 'Hello World!',
        }),
      )
    })

    it('should successfully reset the storage', async () => {
      await storage.reset()

      const { Contents } = await storage.send(
        new ListObjectsV2Command({ Bucket: bucketName }),
      )

      expect(Contents).toBeUndefined()
    })
  })
})
