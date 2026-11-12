import { Injectable, signal } from '@angular/core';
import type { CurrentUser } from '../../models/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly permissionSet = signal<ReadonlySet<string>>(new Set());
  private readonly roleSet = signal<ReadonlySet<string>>(new Set());
  private readonly readyState = signal(false);
  private readonly mustChange = signal(false);
  private readonly userId = signal<string | null>(null);

  readonly ready = this.readyState.asReadonly();
  readonly mustChangePassword = this.mustChange.asReadonly();
  readonly currentUserId = this.userId.asReadonly();

  load(user: CurrentUser): void {
    this.permissionSet.set(new Set(user.permissions));
    this.roleSet.set(new Set(user.roles));
    this.mustChange.set(user.mustChangePassword === true);
    this.userId.set(user.id);
    this.readyState.set(true);
  }

  markReady(): void {
    this.readyState.set(true);
  }

  clear(): void {
    this.permissionSet.set(new Set());
    this.roleSet.set(new Set());
    this.mustChange.set(false);
    this.userId.set(null);
    this.readyState.set(false);
  }

  hasPermission(permission: string): boolean {
    return this.permissionSet().has(permission);
  }

  hasAnyPermission(...permissions: readonly string[]): boolean {
    return permissions.some((permission) => this.permissionSet().has(permission));
  }

  hasAllPermissions(...permissions: readonly string[]): boolean {
    return permissions.every((permission) => this.permissionSet().has(permission));
  }

  hasRole(role: string): boolean {
    return this.roleSet().has(role);
  }

  hasAnyRole(...roles: readonly string[]): boolean {
    return roles.some((role) => this.roleSet().has(role));
  }
}
