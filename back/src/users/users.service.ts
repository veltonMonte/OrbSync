import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
        avatarUrl: createUserDto.avatarUrl,
      },
    });

    return this.excludePassword(user);
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.excludePassword(u));
  }

  async findOne(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return this.excludePassword(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'>> {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    return this.excludePassword(user);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _, ...rest } = user;
    return rest;
  }
}
