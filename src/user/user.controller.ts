import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiCreatedResponse, ApiOkResponse, ApiForbiddenResponse, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiSecurity('accessToken')
@ApiSecurity('bearer')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Create a new user',
    description: 'Super Admin can create any role. Admin can only create users with lower privileges.',
  })
  @ApiCreatedResponse({ description: 'User created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No valid token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions to create user with this role' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const userRole = req.user?.role;
    return this.userService.create(createUserDto, userRole);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Return all users' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No valid token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin access required' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ description: 'Return user by ID' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin access required' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user',
    description: 'Super Admin can update anyone. Admin can update everyone except Super Admins.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ description: 'User updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No valid token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions to update this user' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    const userRole = req.user?.role;
    return this.userService.update(id, updateUserDto, userRole);
  }

  @ApiOperation({
    summary: 'Delete a user',
    description: 'Super Admin can delete anyone. Admin can delete everyone except Super Admins.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No valid token' })
  @ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions to delete this user' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userRole = req.user?.role;
    return this.userService.remove(id, userRole);
  }

  @ApiOperation({
    summary: 'Change user password',
    description: 'User can change their own password. Required on first login.',
  })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - No valid token' })
  @Post('change-password/current')
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.userService.changePassword(userId, changePasswordDto);
  }
}
