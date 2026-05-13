import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkOrders } from './work-orders';

describe('WorkOrders', () => {
  let component: WorkOrders;
  let fixture: ComponentFixture<WorkOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOrders],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
