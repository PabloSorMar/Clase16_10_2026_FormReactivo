import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  AlertController,
  ToastController
} from '@ionic/angular';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  moonOutline,
  sunnyOutline,
  downloadOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { jsPDF } from 'jspdf';

// Validador personalizado: la fecha de nacimiento no puede ser superior a hoy
export function fechaNoFuturaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const fechaSeleccionada = new Date(control.value);
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999); // Permitir cualquier hora del día actual
  if (fechaSeleccionada > hoy) {
    return { fechaFutura: true };
  }
  return null;
}

export interface RegistroData {
  nombre: string;
  email: string;
  fechaNacimiento: string;
  fechaRegistro: string;
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ],
})
export class RegistroPage {
  public registroForm: FormGroup;
  public isSubmitting = signal<boolean>(false);
  public isDarkMode = signal<boolean>(false);
  public lastSubmittedData = signal<RegistroData | null>(null);

  // Fecha máxima para el input date (hoy)
  public maxDate: string = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      moonOutline,
      sunnyOutline,
      downloadOutline,
      checkmarkCircleOutline
    });

    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
      ]],
      fechaNacimiento: ['', [Validators.required, fechaNoFuturaValidator]]
    });
  }

  get f() {
    return this.registroForm.controls;
  }

  public toggleDarkMode(): void {
    const nuevoEstado = !this.isDarkMode();
    this.isDarkMode.set(nuevoEstado);
    document.documentElement.classList.toggle('ion-palette-dark', nuevoEstado);
  }

  public async cifrarPassword(password: string): Promise<string> {
    if (!password) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async onSubmit(): Promise<void> {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched(); // Fuerza la visualización de errores
      return;
    }

    this.isSubmitting.set(true);

    try {
      const rawValues = this.registroForm.value;
      const passwordCifrada = await this.cifrarPassword(rawValues.password);

      const submittedData: RegistroData = {
        nombre: rawValues.nombre,
        email: rawValues.email,
        fechaNacimiento: rawValues.fechaNacimiento,
        fechaRegistro: new Date().toLocaleString('es-ES')
      };

      const payloadAPI = {
        ...submittedData,
        password: passwordCifrada // Contraseña cifrada en hash SHA-256, nunca en texto plano
      };

      console.log('Payload a enviar a la API REST (contraseña cifrada):', payloadAPI);

      // Simulación de llamada asíncrona a un backend HTTP
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Guardar datos enviados para la descarga del PDF
      this.lastSubmittedData.set(submittedData);

      this.registroForm.reset();

      // Muestra un alert informando que se ha enviado correctamente con opción de descargar PDF
      const alert = await this.alertController.create({
        header: '¡Registro Exitoso!',
        subHeader: 'Formulario enviado',
        message: 'El formulario se ha enviado correctamente. Ya puedes descargar tu comprobante en PDF.',
        buttons: [
          {
            text: 'Descargar PDF',
            handler: () => {
              this.descargarPDF();
            }
          },
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ]
      });
      await alert.present();

      // Notificación toast complementaria
      const toast = await this.toastController.create({
        message: '¡Registro completado con éxito!',
        duration: 3000,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (error) {
      console.error('Error al persistir los datos', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public descargarPDF(): void {
    const data = this.lastSubmittedData();
    if (!data) return;

    const doc = new jsPDF();

    // Franja superior con color primario
    doc.setFillColor(56, 128, 255);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Comprobante de Registro', 20, 21);

    // Metadata
    doc.setTextColor(90, 90, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Fecha y hora de registro: ${data.fechaRegistro}`, 20, 44);

    // Línea divisoria
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    // Título de la sección
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Datos del Usuario Registrado:', 20, 60);

    // Lista de datos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Nombre completo: ${data.nombre}`, 25, 72);
    doc.text(`• Correo electrónico: ${data.email}`, 25, 84);
    doc.text(`• Fecha de nacimiento: ${data.fechaNacimiento}`, 25, 96);

    // Pie de página
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 115, 190, 115);
    doc.setFontSize(10);
    doc.setTextColor(130, 130, 130);
    doc.text('Documento generado automáticamente por el sistema de formularios reactivos Ionic.', 20, 125);

    const safeName = data.nombre.trim().replace(/\s+/g, '_').toLowerCase();
    doc.save(`registro_${safeName}.pdf`);
  }
}
