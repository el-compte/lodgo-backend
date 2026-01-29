import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from './enums/user-role.enum';
import { PermissionService } from './services/permission.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private permissionService: PermissionService,
  ) {}

  async create(createUserDto: CreateUserDto, requestingUserRole?: UserRole) {
    // Check permissions if requesting user role is provided
    if (requestingUserRole) {
      const targetRole = createUserDto.role || UserRole.USER;
      if (
        !this.permissionService.canCreateUserWithRole(
          requestingUserRole,
          targetRole,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to create a user with this role. Your role cannot create users of equal or higher privilege level.',
        );
      }
    }

    let password = createUserDto.password;
    let temporaryPassword: string | undefined;
    let isFirstLogin = false;

    // If no password provided, generate a temporary password
    if (!password) {
      temporaryPassword = await this.generateTemporaryPassword();
      password = temporaryPassword;
      isFirstLogin = true;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userPayload = {
      ...createUserDto,
      password: hashedPassword,
      isFirstLogin,
      ...(temporaryPassword && { temporaryPassword }),
    };

    const createdUser = new this.userModel(userPayload);
    const savedUser = await createdUser.save();

    // Return user info including temporary password if it was generated
    const result = savedUser.toObject();
    if (temporaryPassword) {
      result.temporaryPassword = temporaryPassword;
    }
    return result;
  }

  async findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserRole?: UserRole,
  ) {
    const targetUser = await this.findOne(id);

    // Check permissions if requesting user role is provided
    if (requestingUserRole) {
      if (
        !this.permissionService.canDeleteOrUpdateUser(
          requestingUserRole,
          targetUser.role,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to update this user. Your role cannot modify users of equal or higher privilege level.',
        );
      }
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string, requestingUserRole?: UserRole) {
    const targetUser = await this.findOne(id);

    // Check permissions if requesting user role is provided
    if (requestingUserRole) {
      if (
        !this.permissionService.canDeleteOrUpdateUser(
          requestingUserRole,
          targetUser.role,
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to delete this user. Your role cannot delete users of equal or higher privilege level.',
        );
      }
    }

    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.findOne(id);

    // Validate that new password and confirm password match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update user password and clear first login flag
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          password: hashedPassword,
          isFirstLogin: false,
          temporaryPassword: undefined,
        },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      message: 'Password changed successfully',
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
    };
  }

  async generateTemporaryPassword(): Promise<string> {
    // Generate a temporary password (12 random characters)
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return tempPassword;
  }
}
