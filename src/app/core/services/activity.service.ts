import { Injectable, signal } from '@angular/core';

export interface ActivityRecord {
  title: string;
  description?: string;
  time: Date;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private _records = signal<ActivityRecord[]>([]);
  readonly records = this._records.asReadonly();

  log(title: string, description?: string): void {
    this._records.update(list => [
      { title, description, time: new Date() },
      ...list.slice(0, 49),
    ]);
  }

  formatTime(date: Date): string {
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
