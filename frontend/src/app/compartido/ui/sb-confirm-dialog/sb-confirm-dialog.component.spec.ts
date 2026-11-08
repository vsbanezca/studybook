import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbConfirmDialogComponent } from './sb-confirm-dialog.component';

describe('SbConfirmDialogComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbConfirmDialogComponent], providers: [provideRouter([])] }));

  it('se crea', () => {
    const f = TestBed.createComponent(SbConfirmDialogComponent);
    f.componentRef.setInput('titulo', 'Confirmas?');
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });
});
