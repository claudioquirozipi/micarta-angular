import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PublicMenu } from './menu.model';

@Injectable({ providedIn: 'root' })
export class PublicMenuService {
  constructor(private http: HttpClient) {}

  getMenu(slug: string) {
    return this.http.get<PublicMenu>(`${environment.apiUrl}/public/menu/${slug}`);
  }
}
