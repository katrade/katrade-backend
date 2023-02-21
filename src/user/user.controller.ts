import {
  Put,
  Get,
  Body,
  Controller,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Patch,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../models/user.model';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post } from '@nestjs/common';
import { TradeService } from 'src/trade/trade.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly tradeService: TradeService,
  ) {}

  @Get('/findAll')
  async findAll() {
    let user = await this.userService.findAll();
    return user;
  }

  @Get()
  async findUser(@Query('username') username: string) {
    let user = await this.userService.findUN(username);
    return user;
  }

  @Get('/searchID')
  async findByID(@Query('id') id: string) {
    let user = await this.userService.sBid(id);
    return user;
  }

  @Get('/sendMail')
  testemail(@Body() data: any) {
    return this.userService.sendEmail(data.Email, data.Name);
  }

  @Get('/profilePic')
  @UseGuards(JwtAuthGuard)
  async profilePic(@Query('id') userId: string) {
    const user: User = await this.userService.sBid(userId);
    return { profilePic: user.profilePic };
  }

  @Put('/info')
  @UseGuards(JwtAuthGuard)
  async info(@Req() req: any, @Body() data: any) {
    return await this.userService.changeInfo(req.user, data);
  }

  @Get('/favourite')
  @UseGuards(JwtAuthGuard)
  async getFavourite(@Req() req: any) {
    let result = await this.userService.getFavorite(req.user);
    return result;
  }

  @Patch('/pushFavourite')
  @UseGuards(JwtAuthGuard)
  async pushFavourite(@Req() req, @Body('id') inventoryId: string) {
    return await this.userService.pushFavourite(req.user.uid, inventoryId);
  }

  @Patch('/pullFavourite')
  @UseGuards(JwtAuthGuard)
  async pullFavourite(@Req() req, @Body('id') inventoryId: string) {
    return await this.userService.pullFavourite(req.user.uid, inventoryId);
  }

  @Put('/setUsername')
  @UseGuards(JwtAuthGuard)
  async setUsername(
    @Req() req: any,
    @Query('newUsername') newUsername: string,
  ) {
    return await this.userService.setUsername(req.user, newUsername);
  }

  @Post('/follow')
  @UseGuards(JwtAuthGuard)
  async follow(@Req() req, @Body('id') id: string) {
    return await this.userService.follow(req.user.uid, id);
  }

  @Post('/unFollow')
  @UseGuards(JwtAuthGuard)
  async unFollow(@Req() req, @Body('id') id: string) {
    return await this.userService.unFollow(req.user.uid, id);
  }

  @Get('/checkFollow')
  @UseGuards(JwtAuthGuard)
  async checkFollow(@Req() req, @Query('id') id: string) {
    return await this.userService.checkFollow(req.user.uid, id);
  }

  @Get('/follow')
  @UseGuards(JwtAuthGuard)
  async follower(@Req() req) {
    return await this.userService.getFollow(req.user.uid);
  }

  @Get('/getFollowById')
  @UseGuards(JwtAuthGuard)
  async getFollowById(@Query('id') userId: string) {
    return await this.userService.getFollow(userId);
  }

  @Post('/getUserFromIdArray')
  @UseGuards(JwtAuthGuard)
  async getUserFromIdArray(@Body('data') idArray: string[]) {
    return await this.userService.getUserFromIdArray(idArray);
  }

  @Post('/updateProfilePic')
  @UseGuards(JwtAuthGuard)
  async uploadFile(
    @Req() req,
    @Body('profilePic') profilePic: string,
  ): Promise<{ value: boolean } | { message: string }> {
    return await this.userService.updateProfilePic(req.user.uid, profilePic);
  }

  @Post('/newRequest')
  @UseGuards(JwtAuthGuard)
  async createRequest(@Req() req, @Body() request: any) {
    return await this.tradeService.createRequest(req.user.uid, request);
  }

  @Get('getUserRequest')
  @UseGuards(JwtAuthGuard)
  async getUserRequest(@Req() req) {
    return await this.tradeService.getUserRequest(req.user.uid);
  }

  @Get('/getUserPending')
  @UseGuards(JwtAuthGuard)
  async getUserPending(@Req() req) {
    return await this.tradeService.getUserPending(req.user.uid);
  }

  @Delete('/cancelRequest')
  @UseGuards(JwtAuthGuard)
  async cancelRequest(
    @Query('id') requestId: string,
  ): Promise<{ value: boolean } | { message: string }> {
    return await this.tradeService.cancelRequest(requestId);
  }

  @Patch('/acceptRequest')
  @UseGuards(JwtAuthGuard)
  async acceptRequest(
    @Body('id') requestId: string,
  ): Promise<{ value: boolean } | { message: string }> {
    return await this.tradeService.AcceptRequest(requestId);
  }

  @Get('/getUserProgess')
  @UseGuards(JwtAuthGuard)
  async getUserProgess(@Req() req) {
    return await this.tradeService.GetUserProgess(req.user.uid);
  }

  @Patch('/lockRequest')
  @UseGuards(JwtAuthGuard)
  async lockRequest(
    @Body('id') requestId: string,
    @Body('inventoryId') inventoryId: string,
  ): Promise<{ value: boolean } | { message: string }> {
    return await this.tradeService.lockRequestAndInventory(
      requestId,
      inventoryId,
    );
  }

  @Patch('/cancelLockRequest')
  @UseGuards(JwtAuthGuard)
  async cancelLockRequest(@Body('id') requestId: string) {
    return await this.tradeService.cancelLockRequest(requestId);
  }

  @Post('/finishTrade')
  @UseGuards(JwtAuthGuard)
  async finishTrade(@Req() req, @Body('requestId') requestId: string) {
    return await this.tradeService.finishTrade(req.user.uid, requestId);
  }

  @Get('/getUserHistory')
  @UseGuards(JwtAuthGuard)
  async getUserHistory(@Req() req) {
    return await this.tradeService.findHistory(req.user.uid);
  }

  @Put('/newUserContact')
  @UseGuards(JwtAuthGuard)
  async newUserContact(
    @Body()
    body: {
      userId: string;
      userName: string;
      contactId: string;
      contactName: string;
    },
  ) {
    console.log('USERNAME IS : ' + body.userName);
    await this.userService.updateuserContact(
      body.userId,
      body.userName,
      body.contactId,
      body.contactName,
    );
    await this.userService.updateuserContact(
      body.contactId,
      body.contactName,
      body.userId,
      body.userName,
    );
  }

  @Get('/getUserContact')
  @UseGuards(JwtAuthGuard)
  async GetUserContact(@Query('userId') userId: string) {
    return await this.userService.getuserContact(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/updateUserContact')
  async updateUserContact(@Body() body: { userId: string; contactId: string }) {
    await this.userService.updateUserContactAray(body.userId, body.contactId);
    await this.userService.updateUserContactAray(body.contactId, body.userId);
  }

  @Get('/getUserFromId')
  @UseGuards(JwtAuthGuard)
  async GetUserFromId(@Query('userId') userId: string) {
    return await this.userService.getUserFromId(userId);
  }

  @Get('/getDealing')
  @UseGuards(JwtAuthGuard)
  async getDealing(@Req() req, @Query('id') userId: string) {
    return await this.tradeService.getDealing(req.user.uid, userId);
  }
}
