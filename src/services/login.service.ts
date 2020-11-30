import { AxiosResponse } from 'axios';
import { Md5 } from 'ts-md5';
import { $Axios } from '../axios-observable';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export class LoginService {
  private static instance: LoginService;
  static getInstance(): LoginService {
    if (!LoginService.instance) {
      LoginService.instance = new LoginService();
    }
    return LoginService.instance;
  }
  private loginPath = '/UserService/DeviceLogin8';
  private deviceKey: any;
  private checksum: any;
  private accessToken: string = 'AF974255-FFED-4A81-9626-93EFF87D4012';

  constructor() {}

  login(): Observable<any> {
    const params = {
      deviceKey: this.getDeviceKey(),
      isJailBroken: 'false',
      checksum: this.getChecksum(),
      deviceType: 'DeviceTypeMac',
      languageKey: 'en',
      advertisingkey: '""',
    };

    return $Axios
      .post(
        process.env.API + this.loginPath,
        {},
        { params, responseType: 'text' }
      )
      .pipe(
        tap((response: AxiosResponse<string>) => {
          this.accessToken = response.data.match(/accessToken="(.*?)"/)![1];
        })
      );
  }
  getChecksum(): string {
    if (!this.checksum) {
      this.checksum = Md5.hashStr(
        `${this.getDeviceKey()}DeviceTypeMacsavysoda`
      ) as string;
    }

    return this.checksum;
  }

  getDeviceKey(): string {
    if (!this.deviceKey) {
      const h = '0123456789abcdef';

      const random = (ar: string) => ar[Math.floor(Math.random() * ar.length)];

      this.deviceKey = [
        random(h),
        random('26ae'),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
        random(h),
      ].join('');
    }
    return this.deviceKey;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  hasAccessToken(): boolean {
    return !!this.accessToken;
  }
}
