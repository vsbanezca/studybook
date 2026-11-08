import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbWordmarkComponent } from './sb-wordmark.component';

describe('SbWordmarkComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbWordmarkComponent], providers: [provideRouter([])] }));

  it('muestra la marca', () => {
    const f = TestBed.createComponent(SbWordmarkComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Study');
    expect(f.nativeElement.querySelector('.book').textContent).toBe('Book');
  });
});
