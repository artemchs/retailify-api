import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateShiftDto } from './dto/create-shift.dto'
import { Roles } from '../../../system/common/decorators'
import { Role } from '../../../system/common/enums'
import { DbService } from '../../../db/db.service'
import { FindAllShiftDto } from './dto/findAll-shifts.dto'
import {
  buildContainsArray,
  buildOrderByArray,
  calculateTotalPages,
  getPaginationData,
} from '../../../system/common/utils/db-helpers'
import { Prisma } from '@prisma/client'
import { UpdateShiftDto } from './dto/update-shift.dto'
import { CashRegisterTransactionDto } from './dto/cash-register-transaction.dto'

@Roles(Role.Admin, Role.Cashier)
@Injectable()
export class ShiftsService {
  constructor(private db: DbService) {}

  private async getUser(id: string) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id,
      },
    })

    if (!user) {
      throw new NotFoundException('Пользователь не найден.')
    }

    return user
  }

  private async getPos(id: string) {
    const pos = await this.db.pointOfSale.findUnique({
      where: {
        id,
      },
    })

    if (!pos) {
      throw new NotFoundException('Точка продажи не найдена.')
    }

    return pos
  }

  private async getShift(id: string) {
    const shift = await this.db.cashierShift.findUnique({
      where: {
        id,
      },
    })

    if (!shift) {
      throw new NotFoundException('Смена не найдена.')
    }

    return shift
  }

  async deposit(
    id: string,
    userId: string,
    depositDto: CashRegisterTransactionDto,
  ) {
    const [shift, user] = await Promise.all([
      this.getShift(id),
      this.getUser(userId),
    ])

    if (user.id !== shift.cashierId && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Извините, вы не можете осуществить внесение средств в эту смену на данной кассе.',
      )
    }

    const pos = await this.db.pointOfSale.findUnique({
      where: {
        id: shift.pointOfSaleId ?? undefined,
      },
    })

    if (!pos) {
      throw new NotFoundException('Касса не найдена.')
    }

    await Promise.all([
      this.db.transaction.create({
        data: {
          amount: depositDto.amount,
          type: 'CASH_REGISTER_DEPOSIT',
          shiftId: shift.id,
          direction: 'CREDIT',
        },
      }),
      this.db.pointOfSale.update({
        where: {
          id: pos.id,
        },
        data: {
          balance: {
            increment: depositDto.amount,
          },
        },
      }),
    ])
  }

  async withdrawal(
    id: string,
    userId: string,
    withdrawalDto: CashRegisterTransactionDto,
  ) {
    const [shift, user] = await Promise.all([
      this.getShift(id),
      this.getUser(userId),
    ])

    if (user.id !== shift.cashierId && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Извините, но вы не можете провести изъятие средств в этой смене на данной кассе.',
      )
    }

    const pos = await this.db.pointOfSale.findUnique({
      where: {
        id: shift.pointOfSaleId ?? undefined,
      },
    })

    if (!pos) {
      throw new NotFoundException('Касса не найдена.')
    }

    if (pos && withdrawalDto.amount > Number(pos.balance)) {
      throw new BadRequestException(
        'Недостаточно средств на кассе для выполнения операции.',
      )
    }

    await Promise.all([
      this.db.transaction.create({
        data: {
          amount: withdrawalDto.amount,
          type: 'CASH_REGISTER_WITHDRAWAL',
          shiftId: shift.id,
          direction: 'DEBIT',
        },
      }),
      this.db.pointOfSale.update({
        where: {
          id: pos.id,
        },
        data: {
          balance: {
            decrement: withdrawalDto.amount,
          },
        },
      }),
    ])
  }

  async create(userId: string, posId: string, createShiftDto: CreateShiftDto) {
    const [user, pos, count] = await Promise.all([
      this.getUser(userId),
      this.getPos(posId),
      this.db.cashierShift.count({
        where: {
          pointOfSaleId: posId,
        },
      }),
    ])

    const cashierShift = await this.db.cashierShift.create({
      data: {
        ...createShiftDto,
        isOpened: true,
        cashierId: user.id,
        pointOfSaleId: pos.id,
        name: `Смена #${count + 1}`,
      },
    })

    this.deposit(cashierShift.id, userId, {
      amount: createShiftDto.startingCashBalance,
    })

    return cashierShift
  }

  async findAll(
    posId: string,
    {
      page,
      rowsPerPage,
      closedAt,
      createdAt,
      orderBy,
      query,
      cashierIds,
    }: FindAllShiftDto,
  ) {
    const { skip, take } = getPaginationData({ page, rowsPerPage })

    const where: Prisma.CashierShiftWhereInput = {
      OR: buildContainsArray({ fields: ['name'], query }),
      pointOfSaleId: posId,
      createdAt: createdAt
        ? {
            gte: createdAt.from ?? undefined,
            lte: createdAt.to ?? undefined,
          }
        : undefined,
      closedAt: closedAt
        ? {
            gte: closedAt.from ?? undefined,
            lte: closedAt.to ?? undefined,
          }
        : undefined,
      cashierId: cashierIds
        ? {
            in: cashierIds,
          }
        : undefined,
    }

    const [items, totalItems] = await Promise.all([
      this.db.cashierShift.findMany({
        where,
        take,
        skip,
        orderBy: buildOrderByArray({ orderBy }),
      }),
      this.db.cashierShift.count({
        where,
      }),
    ])

    return {
      items,
      info: {
        totalPages: calculateTotalPages(totalItems, take),
        totalItems,
      },
    }
  }

  async findOne(id: string) {
    const shift = this.getShift(id)

    return shift
  }

  @Roles(Role.Admin)
  async update(id: string, updateShiftDto: UpdateShiftDto) {
    await this.getShift(id)

    await this.db.cashierShift.update({
      where: {
        id,
      },
      data: updateShiftDto,
    })
  }

  async close(id: string, userId: string) {
    const [shift, user] = await Promise.all([
      this.getShift(id),
      this.getUser(userId),
    ])

    if (user.id !== shift.cashierId && user.role !== 'ADMIN') {
      throw new BadRequestException('Вы не можете закрыть эту смену.')
    }

    await this.db.cashierShift.update({
      where: {
        id,
      },
      data: {
        closedAt: new Date(),
        isOpened: false,
      },
    })
  }
}
