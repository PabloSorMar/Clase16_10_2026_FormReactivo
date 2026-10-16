import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';
import { AlertController, ToastController } from '@ionic/angular';

describe('HomePage - Formulario Reactivo y Validaciones', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockToastController: any;
  let mockAlertController: any;

  beforeEach(async () => {
    mockToastController = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
      }),
    };

    mockAlertController = {
      create: vi.fn().mockResolvedValue({
        present: vi.fn().mockResolvedValue(undefined),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: ToastController, useValue: mockToastController },
        { provide: AlertController, useValue: mockAlertController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('el formulario debe inicializarse vacío e inválido', () => {
    expect(component.registroForm.valid).toBe(false);
    expect(component.registroForm.get('nombre')?.value).toBe('');
    expect(component.registroForm.get('email')?.value).toBe('');
    expect(component.registroForm.get('password')?.value).toBe('');
    expect(component.registroForm.get('fechaNacimiento')?.value).toBe('');
  });

  describe('Validación del campo "nombre"', () => {
    it('debe ser obligatorio', () => {
      const nombreControl = component.registroForm.get('nombre');
      nombreControl?.setValue('');
      expect(nombreControl?.valid).toBe(false);
      expect(nombreControl?.hasError('required')).toBe(true);
    });

    it('debe fallar si tiene menos de 3 caracteres', () => {
      const nombreControl = component.registroForm.get('nombre');
      nombreControl?.setValue('Ab');
      expect(nombreControl?.valid).toBe(false);
      expect(nombreControl?.hasError('minlength')).toBe(true);
    });

    it('debe ser válido con 3 o más caracteres', () => {
      const nombreControl = component.registroForm.get('nombre');
      nombreControl?.setValue('Ana');
      expect(nombreControl?.valid).toBe(true);
    });
  });

  describe('Validación del campo "email"', () => {
    it('debe ser obligatorio', () => {
      const emailControl = component.registroForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('debe fallar si el formato no es un email válido', () => {
      const emailControl = component.registroForm.get('email');
      emailControl?.setValue('correo_invalido');
      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('debe ser válido con un correo electrónico correcto', () => {
      const emailControl = component.registroForm.get('email');
      emailControl?.setValue('usuario@ejemplo.com');
      expect(emailControl?.valid).toBe(true);
    });
  });

  describe('Validación del campo "password"', () => {
    it('debe ser obligatorio', () => {
      const passControl = component.registroForm.get('password');
      passControl?.setValue('');
      expect(passControl?.valid).toBe(false);
      expect(passControl?.hasError('required')).toBe(true);
    });

    it('debe fallar si tiene menos de 8 caracteres', () => {
      const passControl = component.registroForm.get('password');
      passControl?.setValue('Abc1234'); // 7 caracteres
      expect(passControl?.valid).toBe(false);
      expect(passControl?.hasError('pattern')).toBe(true);
    });

    it('debe fallar si no tiene números', () => {
      const passControl = component.registroForm.get('password');
      passControl?.setValue('Password'); // Sin números
      expect(passControl?.valid).toBe(false);
      expect(passControl?.hasError('pattern')).toBe(true);
    });

    it('debe fallar si no tiene letras', () => {
      const passControl = component.registroForm.get('password');
      passControl?.setValue('12345678'); // Sin letras
      expect(passControl?.valid).toBe(false);
      expect(passControl?.hasError('pattern')).toBe(true);
    });

    it('debe ser válido con mínimo 8 caracteres alfanuméricos (letras y números)', () => {
      const passControl = component.registroForm.get('password');
      passControl?.setValue('Password123');
      expect(passControl?.valid).toBe(true);
    });
  });

  describe('Validación del campo "fechaNacimiento"', () => {
    it('debe ser obligatorio', () => {
      const fechaControl = component.registroForm.get('fechaNacimiento');
      fechaControl?.setValue('');
      expect(fechaControl?.valid).toBe(false);
      expect(fechaControl?.hasError('required')).toBe(true);
    });

    it('no debe permitir una fecha posterior a hoy', () => {
      const fechaControl = component.registroForm.get('fechaNacimiento');
      const manana = new Date();
      manana.setDate(manana.getDate() + 2);
      fechaControl?.setValue(manana.toISOString().split('T')[0]);
      expect(fechaControl?.valid).toBe(false);
      expect(fechaControl?.hasError('fechaFutura')).toBe(true);
    });

    it('debe ser válido con la fecha de hoy o una fecha pasada', () => {
      const fechaControl = component.registroForm.get('fechaNacimiento');
      const hoy = new Date().toISOString().split('T')[0];
      fechaControl?.setValue(hoy);
      expect(fechaControl?.valid).toBe(true);

      fechaControl?.setValue('2000-05-15');
      expect(fechaControl?.valid).toBe(true);
    });
  });

  describe('Funcionalidad de Modo Oscuro', () => {
    it('debe alternar el modo oscuro y actualizar la clase ion-palette-dark en documentElement', () => {
      expect(component.isDarkMode()).toBe(false);
      component.toggleDarkMode();
      expect(component.isDarkMode()).toBe(true);
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);

      component.toggleDarkMode();
      expect(component.isDarkMode()).toBe(false);
      expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
    });
  });

  describe('Validación completa del formulario, Submit y Descarga PDF', () => {
    it('el formulario debe ser válido solo cuando todos los campos sean válidos', () => {
      component.registroForm.setValue({
        nombre: 'Pablo Soriano',
        email: 'pablo@ejemplo.com',
        password: 'Password123',
        fechaNacimiento: '1998-10-20'
      });
      expect(component.registroForm.valid).toBe(true);
    });

    it('onSubmit no debe procesar si el formulario es inválido y debe marcar campos como touched', async () => {
      expect(component.registroForm.valid).toBe(false);
      await component.onSubmit();
      expect(component.registroForm.get('nombre')?.touched).toBe(true);
      expect(component.registroForm.get('email')?.touched).toBe(true);
      expect(component.registroForm.get('password')?.touched).toBe(true);
      expect(component.registroForm.get('fechaNacimiento')?.touched).toBe(true);
      expect(component.isSubmitting()).toBe(false);
    });

    it('onSubmit debe guardar lastSubmittedData, mostrar alert y toast', async () => {
      component.registroForm.setValue({
        nombre: 'Pablo Soriano',
        email: 'pablo@ejemplo.com',
        password: 'Password123',
        fechaNacimiento: '1998-10-20'
      });
      expect(component.registroForm.valid).toBe(true);

      const submitPromise = component.onSubmit();
      expect(component.isSubmitting()).toBe(true);

      await submitPromise;
      expect(component.isSubmitting()).toBe(false);
      expect(component.registroForm.get('nombre')?.value).toBeNull();
      expect(component.lastSubmittedData()).not.toBeNull();
      expect(component.lastSubmittedData()?.nombre).toBe('Pablo Soriano');
      expect(mockAlertController.create).toHaveBeenCalled();
      expect(mockToastController.create).toHaveBeenCalled();
    });

    it('descargarPDF debe invocar jsPDF sin errores cuando hay datos', () => {
      component.lastSubmittedData.set({
        nombre: 'Pablo Soriano',
        email: 'pablo@ejemplo.com',
        fechaNacimiento: '1998-10-20',
        fechaRegistro: '16/10/2026, 09:30:00'
      });

      expect(() => component.descargarPDF()).not.toThrow();
    });
  });
});



