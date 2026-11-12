import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbHeaderComponent } from './sb-header.component';

describe('SbHeaderComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SbHeaderComponent], providers: [provideRouter([])] }));

  it('sin sesion y sin rutas no muestra enlaces', () => {
    const f = TestBed.createComponent(SbHeaderComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('a').length).toBe(0);
  });

  it('miembro con todas las rutas muestra 2 enlaces', () => {
    const f = TestBed.createComponent(SbHeaderComponent);
    f.componentRef.setInput('rol', 'miembro');
    f.componentRef.setInput('soloRutasExistentes', false);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('a').length).toBe(2);
  });

  describe('menu del perfil', () => {
    let f: ComponentFixture<SbHeaderComponent>;
    let el: HTMLElement;
    let emitido: number;
    const avatar = () => el.querySelector<HTMLButtonElement>('button.avatar')!;
    const menu = () => el.querySelector('[role="menu"]');
    const opcion = () => el.querySelector<HTMLButtonElement>('[role="menuitem"]')!;

    beforeEach(async () => {
      f = TestBed.createComponent(SbHeaderComponent);
      f.componentRef.setInput('rol', 'miembro');
      f.componentRef.setInput('nombre', 'Ana Pérez');
      emitido = 0;
      f.componentInstance.cerrarSesionSolicitado.subscribe(() => emitido++);
      el = f.nativeElement;
      document.body.appendChild(el);
      await f.whenStable();
    });

    afterEach(() => el.remove());

    it('el perfil es un boton de 44 px de alto que no muestra el menu hasta pulsarlo', () => {
      expect(avatar().textContent?.trim()).toBe('A');
      expect(avatar().getAttribute('aria-haspopup')).toBe('menu');
      expect(avatar().getAttribute('aria-expanded')).toBe('false');
      expect(menu()).toBeNull();
    });

    it('al pulsar el perfil abre el menu con el nombre y «Cerrar sesión»', async () => {
      avatar().click();
      await f.whenStable();
      expect(menu()).not.toBeNull();
      expect(avatar().getAttribute('aria-expanded')).toBe('true');
      expect(menu()!.textContent).toContain('Ana Pérez');
      expect(opcion().textContent?.trim()).toBe('Cerrar sesión');
    });

    it('pulsar el perfil otra vez cierra el menu', async () => {
      avatar().click();
      await f.whenStable();
      avatar().click();
      await f.whenStable();
      expect(menu()).toBeNull();
    });

    it('«Cerrar sesión» emite el evento y cierra el menu', async () => {
      avatar().click();
      await f.whenStable();
      opcion().click();
      await f.whenStable();
      expect(emitido).toBe(1);
      expect(menu()).toBeNull();
    });

    it('Esc cierra el menu y devuelve el foco al perfil', async () => {
      avatar().click();
      await f.whenStable();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await f.whenStable();
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(avatar());
      expect(emitido).toBe(0);
    });

    it('un clic fuera del encabezado cierra el menu sin cerrar la sesion', async () => {
      avatar().click();
      await f.whenStable();
      document.body.click();
      await f.whenStable();
      expect(menu()).toBeNull();
      expect(emitido).toBe(0);
    });

    it('sin sesion no hay perfil ni menu', async () => {
      f.componentRef.setInput('rol', null);
      await f.whenStable();
      expect(el.querySelector('button.avatar')).toBeNull();
    });
  });
});
