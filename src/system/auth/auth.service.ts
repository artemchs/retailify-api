import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { DbService } from '../../db/db.service'
import { LogInDto, LogOutDto, RefreshTokenDto, SignUpDto } from './dto'
import * as argon2 from 'argon2'
import { Tokens } from './types'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UserPayloadAccessToken } from '../common/types'

@Injectable()
export class AuthService {
  constructor(
    private db: DbService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  hashData(data: string) {
    return argon2.hash(data)
  }

  async signTokens(payload: UserPayloadAccessToken): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: 60 * 15,
        secret: this.config.get('JWT_AT_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: 60 * 60 * 24 * 7,
        secret: this.config.get('JWT_RT_SECRET'),
      }),
    ])

    return {
      accessToken: at,
      refreshToken: rt,
    }
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      throw new NotFoundException('User has not been found.')
    }

    const rtHash = await this.hashData(refreshToken)

    await this.db.systemUser.update({
      where: {
        id: user.id,
      },
      data: {
        rtHash,
      },
    })
  }

  async signUp({ fullName, username, password }: SignUpDto): Promise<Tokens> {
    const existingUser = await this.db.systemUser.findUnique({
      where: {
        username,
      },
    })

    if (existingUser) {
      throw new BadRequestException('This username is already taken.')
    }

    const hash = await this.hashData(password)

    const newUser = await this.db.systemUser.create({
      data: {
        fullName,
        username,
        hash,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
      },
    })

    const tokens = await this.signTokens({
      sub: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
    })

    await this.updateRefreshTokenHash(newUser.id, tokens.refreshToken)

    return tokens
  }

  async logIn({ username, password }: LogInDto): Promise<Tokens> {
    const user = await this.db.systemUser.findUnique({
      where: {
        username,
      },
    })

    if (!user) {
      throw new NotFoundException('User has not been found.')
    }

    const pwMatches = await argon2.verify(user.hash, password)

    if (!pwMatches) {
      throw new UnauthorizedException('Passwords do not match.')
    }

    const tokens = await this.signTokens({
      sub: user.id,
      username: user.username,
      fullName: user.fullName,
    })

    await this.updateRefreshTokenHash(user.id, tokens.refreshToken)

    return tokens
  }

  async logOut({ userId }: LogOutDto) {
    await this.db.systemUser.updateMany({
      where: {
        AND: {
          id: userId,
          rtHash: {
            not: null,
          },
        },
      },
      data: {
        rtHash: null,
      },
    })
  }

  async refreshToken({ userId, refreshToken }: RefreshTokenDto) {
    const user = await this.db.systemUser.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      throw new NotFoundException('User has not been found.')
    }

    if (!user.rtHash) {
      throw new ForbiddenException('Access denied.')
    }

    const rtMatches = await argon2.verify(user.rtHash, refreshToken)

    if (!rtMatches) {
      throw new ForbiddenException('Access denied.')
    }

    const tokens = await this.signTokens({
      sub: user.id,
      username: user.username,
      fullName: user.fullName,
    })

    await this.updateRefreshTokenHash(user.id, tokens.refreshToken)

    return tokens
  }
}
