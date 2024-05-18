import { PrismaClient } from '@prisma/client'
// import { fakerUK as faker } from '@faker-js/faker'
import * as argon from 'argon2'
import { env } from 'process'

const prisma = new PrismaClient()

// function getRandomBoolean(): boolean {
//   return Math.random() < 0.5
// }

async function resetDb() {
  await Promise.all([
    prisma.allowedSystemUserEmail.deleteMany(),
    prisma.systemUser.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.characteristic.deleteMany(),
  ])
}

async function seedSystemUsers() {
  try {
    await Promise.all([
      prisma.systemUser.create({
        data: {
          email: 'admin@user.com',
          fullName: 'Артем Черниш',
          hash: await argon.hash('admin'),
          role: 'ADMIN',
          soleProprietorInfo: {
            create: {},
          },
        },
      }),
      prisma.allowedSystemUserEmail.create({
        data: {
          email: 'admin@user.com',
        },
      }),
    ])

    console.log('Successfully created an admin user.')
  } catch (e) {
    console.error('Could not create an admin user: ', e)
  }

  // for (let i = 0; i < 4; i++) {
  //   try {
  //     const fullName = faker.person.fullName()
  //     const email = faker.internet.email()
  //     const hash = await argon.hash('password')

  //     await Promise.all([
  //       prisma.allowedSystemUserEmail.upsert({
  //         create: {
  //           email,
  //         },
  //         update: {
  //           email,
  //         },
  //         where: {
  //           email,
  //         },
  //       }),
  //       prisma.systemUser.upsert({
  //         create: {
  //           email,
  //           fullName,
  //           hash,
  //           role: getRandomBoolean() ? 'CASHIER' : 'ECOMMERCE_MANAGER',
  //         },
  //         update: {
  //           fullName,
  //           email,
  //           hash,
  //         },
  //         where: {
  //           email,
  //         },
  //       }),
  //     ])

  //     console.log(
  //       'Successfully created a new system user with an allowed email.',
  //     )
  //   } catch (e) {
  //     console.error(
  //       'Could not create a new system user with an allowed email: ',
  //       e,
  //     )
  //   }
  // }
}

// const supplierIds: string[] = []
// async function seedSuppliers() {
//   for (let i = 0; i < 5; i++) {
//     try {
//       const supplier = await prisma.supplier.create({
//         data: {
//           name: faker.company.name(),
//           contactPerson: faker.person.fullName(),
//           email: faker.internet.email(),
//           phone: faker.phone.number(),
//           address: faker.location.streetAddress(),
//         },
//       })
//       console.log('Successfully created a new supplier.')
//       supplierIds.push(supplier.id)
//     } catch (e) {
//       console.log('Could not create a new supplier: ', e)
//     }
//   }
// }

// const warehouseIds: string[] = []
// async function seedWarehouses() {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const warehouse = await prisma.warehouse.create({
//         data: {
//           name: faker.company.name(),
//           address: faker.location.streetAddress(),
//         },
//       })
//       console.log('Successfully created a new warehouse.')
//       warehouseIds.push(warehouse.id)
//     } catch (e) {
//       console.log('Could not create a new warehouse: ', e)
//     }
//   }
// }

// const characteristicIds: string[] = []
// async function seedCharacteristics() {
//   for (let i = 0; i < 20; i++) {
//     try {
//       const characteristic = await prisma.characteristic.create({
//         data: {
//           name: faker.lorem.word(),
//         },
//       })
//       console.log('Successfully created a new characteristic')
//       characteristicIds.push(characteristic.id)
//     } catch (e) {
//       console.log('Could not create a new characteristic: ', e)
//     }
//   }
// }

async function main() {
  if (env.NODE_ENV === 'development') {
    await resetDb()
    await seedSystemUsers()
    // await seedSuppliers()
    // await seedWarehouses()
    // await seedCharacteristics()
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
