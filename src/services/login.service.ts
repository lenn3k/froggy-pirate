import { AxiosResponse } from 'axios';
import { Md5 } from 'ts-md5';
import { $Axios } from '../axios-observable';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { time } from 'console';

export class LoginService {
  private static instance: LoginService;
  static getInstance(): LoginService {
    if (!LoginService.instance) {
      LoginService.instance = new LoginService();
    }
    return LoginService.instance;
  }
  private loginPath = '/UserService/DeviceLogin8';
  private deviceLogin11Path = '/UserService/DeviceLogin11';
  private deviceKey: any;
  private checksum: any;
  private accessToken: string | undefined =
    'AF974255-FFED-4A81-9626-93EFF87D4012';

  constructor() {
    this.login();
  }

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

  deviceLogin11(): Observable<any> {
    const { time, checksum } = this.getChecksum11();

    const params = {
      deviceKey: `465e7484d8cacc3c`,
      isJailBroken: 'false',
      checksum,
      time,
      deviceType: 'DeviceTypeAndroid',
      languageKey: 'en',
      advertisingkey: '""',
    };
    console.log(JSON.stringify(params));

    return $Axios
      .post<string>(
        process.env.API + this.deviceLogin11Path,
        {},
        { params, responseType: 'text' }
      )
      .pipe(
        tap((response: AxiosResponse<string>) => {
          const token = response.data.match(/accessToken="(.*?)"/);
          if (token) {
            this.accessToken = token[1];
          }
        }),
        map((response) => response.data)
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
    if (!this.hasAccessToken) {
      throw new Error('No access token, check first');
    }
    return this.accessToken || '';
  }

  hasAccessToken(): boolean {
    return !!this.accessToken;
  }

  getChecksum11(): any {
    const deviceKey = '465e7484d8cacc3c';
    const checksumKey = '5343';
    const time = new Date().toISOString().slice(0, 19);

    const checksum = Md5.hashStr(
      `${this.getDeviceKey()}${time}DeviceTypeAndroid${checksumKey}savysoda`
    ) as string;

    return { checksum, time };
  }
}
