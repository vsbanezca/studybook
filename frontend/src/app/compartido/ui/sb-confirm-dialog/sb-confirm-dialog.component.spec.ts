import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SbConfirmDialogComponent } from './sb-confirm-dialog.component';

describe('SbConfirmDialogComponent', () => {
  let fixture: ComponentFixture<SbConfirmDialogComponent>;
  let confirmado: number;
  let rechazado: number;

  const panel = () => document.querySelector('.sb-modal-panel');
  const botones = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.sb-modal-panel button'));
  const abrir = async () => {
    fixture.componentRef.setInput('abierto', true);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [SbConfirmDialogComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SbConfirmDialogComponent);
    confirmado = 0;
    rechazado = 0;
    fixture.componentInstance.confirmado.subscribe(() => confirmado++);
    fixture.componentInstance.rechazado.subscribe(() => rechazado++);
    fixture.componentRef.setInput('titulo', '¿Confirmas?');
    fixture.componentRef.setInput('datos', [
      { etiqueta: 'Nombre', valor: 'Ana' },
      { etiqueta: 'Correo', valor: 'ana@ucab.edu.ve' },
    ]);
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.componentRef.setInput('abierto', false);
    document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = ''));
  });

  it('no muestra nada mientras no esta abierto', () => {
    expect(panel()).toBeNull();
  });

  it('muestra el titulo, el resumen y los botones No y Sí', async () => {
    await abrir();
    expect(panel()?.textContent).toContain('¿Confirmas?');
    expect(panel()?.textContent).toContain('Nombre');
    expect(panel()?.textContent).toContain('ana@ucab.edu.ve');
    expect(botones().map((b) => b.textContent?.trim())).toEqual(['No', 'Sí']);
  });

  it('Sí emite confirmado y no emite rechazado', async () => {
    await abrir();
    botones()[1].click();
    await fixture.whenStable();
    expect(confirmado).toBe(1);
    expect(rechazado).toBe(0);
    expect(panel()).toBeNull();
  });

  it('No emite rechazado y no confirma', async () => {
    await abrir();
    botones()[0].click();
    await fixture.whenStable();
    expect(confirmado).toBe(0);
    expect(rechazado).toBe(1);
    expect(panel()).toBeNull();
  });

  it('Esc equivale a No', async () => {
    await abrir();
    document.querySelector('.cdk-dialog-container')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await fixture.whenStable();
    expect(confirmado).toBe(0);
    expect(rechazado).toBe(1);
  });

  it('clic afuera equivale a No', async () => {
    await abrir();
    document.querySelector<HTMLElement>('.sb-modal-fondo')!.click();
    await fixture.whenStable();
    expect(confirmado).toBe(0);
    expect(rechazado).toBe(1);
  });
});
