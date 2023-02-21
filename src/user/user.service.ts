import { Injectable } from '@nestjs/common';
import { Student, User } from '../models/user.model';
import { Inventory } from 'src/models/inventory.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { InventoryService } from 'src/inventory/inventory.service';
import { FollowDocument, Follow } from 'src/models/follow.model';
import { request } from 'http';
require('dotenv').config();

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly inventoryService: InventoryService,
    @InjectModel('Follow') private readonly followModel: Model<FollowDocument>,
  ) {}

  async findForSignin(query: string): Promise<User> {
    return await this.userModel.findOne({
      $or: [{ email: query }, { username: query }],
    });
  }

  async findAll() {
    const user: User[] = await this.userModel.find();
    return user;
  }

  async findAny(a: any) {
    const user = await this.userModel.findOne(a);
    return user as User;
  }

  async findUN(username: string) {
    const user = await this.userModel.findOne({ username: username });
    return user as User;
  }

  async sBid(id: string) {
    const user = await this.userModel.findOne({ _id: id });
    return user as User;
  }

  async changePassword(
    uid: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user: User = await this.userModel.findOne({ _id: uid });
    const c: boolean = await bcrypt.compare(currentPassword, user.password);
    if (!c) {
      return { value: false };
    }
    const hashPassword: string = await bcrypt.hash(
      newPassword,
      parseInt(process.env.salt),
    );
    await this.userModel.updateOne(
      { _id: uid },
      { $set: { password: hashPassword } },
    );
    return { value: true };
  }

  private async updateUserAndGenerrateTokenAndSendEmailVerify(
    user: User,
    data: User,
  ): Promise<string> {
    await this.userModel.updateOne({ _id: user._id }, { $set: data });
    let payload: any = {
      sub: user._id,
    };
    let token: string = this.jwtService.sign(payload);
    return await this.mailService.sendVerifyEmail({
      token: token,
      email: data.email,
      name: data.firstname,
    });
  }

  async createStudent(username: string, password: string, student: Student) {
    const findUser = await this.userModel.findOne({
      isStudent: true,
      studentId: student.stdCode,
    });

    if (findUser) return { msg: 'Student existed', success: false };

    let hashPassword: string = await bcrypt.hash(
      password,
      parseInt(process.env.salt),
    );
    const newStudent = new this.userModel({
      firstname: student.firstNameEn,
      lastname: student.lastNameEn,
      username: '',
      password: hashPassword,
      address: '',
      email: '',
      phoneNumber: '',
      profilePic: '',
      verifyEmail: 1,
      favourite: [],
      inventories: [],
      requestInbox: [],
      userContacts: [],
      isStudent: true,
      student: student,
      studentId: student.stdCode
    });
    // push in to db and sign jwt
    let user = await this.userModel.create(newStudent);
    // console.log(user);
    let payload: any = {
      sub: user._id,
    };
    let token: string = this.jwtService.sign(payload);
    return {
      success: true,
      token: token,
    };
  }

  async craete_new_user(data: User, student?: Student) {
    let hashPassword: string = await bcrypt.hash(
      data.password,
      parseInt(process.env.salt),
    );
    data.password = hashPassword;
    const newUser = new this.userModel({
      firstname: data.firstname,
      lastname: data.lastname,
      username: '',
      password: data.password,
      address: '',
      email: data.email,
      phoneNumber: data.phoneNumber,
      profilePic: '',
      verifyEmail: 0,
      favourite: [],
      inventories: [],
      requestInbox: [],
      userContacts: [],
      isStudent: false,
      student: {},
      studentId: ""
    });
    let m: any = '';
    let checkEmail: User = await this.userModel.findOne({ email: data.email });
    if (checkEmail) {
      if (checkEmail.verifyEmail === 1) {
        m = 'This email is already used';
      } else {
        m = await this.updateUserAndGenerrateTokenAndSendEmailVerify(
          checkEmail,
          data,
        );
      }
    } else {
      let user = await this.userModel.create(newUser);
      let payload: any = {
        sub: user._id,
      };
      let token: string = this.jwtService.sign(payload);
      m = await this.mailService.sendVerifyEmail({
        token: token,
        email: data.email,
        name: data.firstname,
      });
    }
    return { message: m };
  }

  async generateResetPasswordToken(email: string) {
    const payload = {
      resetPasswordEmail: email,
    };
    return await this.jwtService.sign(payload);
  }

  async resetPassword(email: string, newPassword: string) {
    const hashPassword: string = await bcrypt.hash(
      newPassword,
      parseInt(process.env.salt),
    );
    await this.userModel.updateOne(
      { email: email },
      { password: hashPassword },
    );
    return { value: true };
  }

  async resendVerifyEmailLink(user: User) {
    if (user.verifyEmail === 1) {
      return { message: 'already verify' };
    }
    let payload: any = {
      sub: user._id,
    };
    let token: string = this.jwtService.sign(payload);
    let m: string = await this.mailService.sendVerifyEmail({
      token: token,
      email: user.email,
      name: user.firstname,
    });
    return { message: m };
  }

  async verifyEmail(payload: any): Promise<any> {
    await this.userModel.updateOne(
      { _id: payload.uid },
      { $set: { verifyEmail: 1 } },
    );
    return { message: 'verify' };
  }

  async changeInfo(payload: any, data: any): Promise<any> {
    let result: any = await this.userModel.updateOne(
      { _id: payload.uid },
      { $set: data },
    );
    return { value: result ? true : false };
  }

  async updateFollow(
    payload: any,
    select: string,
    data: string[],
  ): Promise<any> {
    let result: any = await this.userModel.updateOne(
      { _id: payload.uid },
      {
        $set: select === 'follower' ? { followers: data } : { following: data },
      },
    );
    return { value: result ? true : false };
  }

  async getFavorite(payload: any): Promise<Inventory[]> {
    const user: User = await this.userModel.findOne({ _id: payload.uid });
    const inventoryArray: Inventory[] =
      await this.inventoryService.getInventoryByIdArray(
        user.favourite,
        payload.uid,
      );
    return inventoryArray;
  }

  async follow(uid: string, userTargetId: string) {
    if (uid === userTargetId) {
      return { message: "Can't follow yourself" };
    }
    const newFollow = new this.followModel({
      from: uid.toString(),
      to: userTargetId.toString(),
      timeStamp: new Date(),
    });
    newFollow.save();
    return { value: true };
  }

  async unFollow(uid: string, userTargetId: string) {
    if (uid === userTargetId) {
      return { message: "Can't unfollow yourself" };
    }
    await this.followModel.deleteOne({ from: uid, to: userTargetId });
    return { value: true };
  }

  async getFollow(uid: string): Promise<any> {
    const fr = await this.followModel.find({ to: uid });
    const fg = await this.followModel.find({ from: uid });
    let follower: string[] = [];
    let following: string[] = [];
    const n: number = fr.length > fg.length ? fr.length : fg.length;
    for (let i = 0; i < n; i++) {
      if (i < fr.length) {
        follower.push(fr[i].from);
      }
      if (i < fg.length) {
        following.push(fg[i].to);
      }
    }
    return { follower: follower, following: following };
  }

  async checkFollow(uid: string, targetId: string) {
    const follow = await this.followModel.findOne({ from: uid, to: targetId });
    if (follow) {
      return { value: true };
    } else {
      return { value: false };
    }
  }

  async setUsername(payload: any, newUsername: string) {
    let checkUsername: User = await this.userModel.findOne({
      username: newUsername,
    });
    if (checkUsername) {
      return { message: 'This username is already used' };
    }
    await this.userModel.updateOne(
      { _id: payload.uid },
      { $set: { username: newUsername } },
    );
    return { value: true };
  }

  async pushFavourite(
    uid: string,
    inventoryId: string,
  ): Promise<{ value: boolean } | { message: string }> {
    await this.userModel.updateOne(
      { _id: uid },
      { $push: { favourite: [inventoryId.toString()] } },
    );
    await this.inventoryService.addFavorite(uid, inventoryId);
    return { value: true };
  }

  async pullFavourite(
    uid: string,
    inventoryId: string,
  ): Promise<{ value: boolean } | { message: string }> {
    await this.userModel.updateOne(
      { _id: uid },
      { $pull: { favourite: inventoryId.toString() } },
    );
    await this.inventoryService.deleteFavorite(uid, inventoryId);
    return { value: true };
  }

  async updateProfilePic(uid: string, profilePic: string) {
    if (profilePic && uid) {
      await this.userModel.updateOne(
        { _id: uid },
        { $set: { profilePic: profilePic } },
      );
      return { value: true };
    }
    return { message: 'missing information' };
  }

  async getUserFromIdArray(idArray: string[]) {
    return await this.userModel.find({ _id: { $in: idArray } });
  }

  async sendEmail(email: string, name: string) {
    await this.mailService.sendVerifyEmail({
      token: '',
      email: email,
      name: name,
    });
    return { message: 'finish' };
  }

  async updateuserContact(
    userId: string,
    userName: string,
    contactId: string,
    contactName: string,
  ) {
    let userroom = await this.userModel.findOne({ _id: userId });
    let contactman = {
      userIdContact: contactId,
      userNameContact: contactName,
    };
    for (var i = 0; i < userroom.userContacts.length; i++) {
      if (userroom.userContacts[i].userIdContact == contactman.userIdContact) {
        return;
      }
    }
    console.log('Have this user in contactlist');
    await this.userModel
      .updateOne(
        { _id: userId },
        { $push: { userContacts: { $each: [contactman], $position: 0 } } },
      )
      .then(() => {
        console.log('Success Add new Contact');
      });
  }

  async updateUserContactAray(userId: string, contactId: any) {
    let contactroom = await this.userModel.findOne({ _id: contactId });
    let contactman = {
      userIdContact: contactId,
      userNameContact: contactroom.username,
    };
    await this.userModel.updateOne(
      { _id: userId },
      {
        $pull: {
          userContacts: {
            userIdContact: contactId,
          },
        },
      },
    );
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $push: {
            userContacts: {
              $each: [contactman],
              $position: 0,
            },
          },
        },
      )
      .then(() => {
        console.log('Update UserContact OK');
      });
  }

  async getuserContact(userId: string) {
    let userroom = await this.userModel.findOne({ _id: userId });
    return userroom.userContacts;
  }

  async getUserFromId(userId: string) {
    let userroom = await this.userModel.findOne({ _id: userId });
    return userroom;
  }

  async forDeleteFav() {
    let users = await this.userModel.find();
    for (let i = 0; i < users.length; i++) {
      await this.userModel.updateOne(
        { _id: users[i]._id },
        { $set: { favourite: [] } },
      );
    }
  }
}
