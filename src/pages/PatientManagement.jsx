import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, User, Edit, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatCPF, formatPhone } from '@/lib/utils';

const initialFormData = {
  name: '', phone: '', cpf: '', responsibleName: '', responsiblePhone: '',
  diagnosis: '', homeDoctor: '', patientDoctor: '',
  hasGrades: 'nao', hasSeatbelt: 'nao', hasAirMattress: 'nao',
  morseScale: '', bradenScale: ''
};

const initialErrors = {
  name: '', phone: '', cpf: '', responsibleName: '', responsiblePhone: ''
};

export default function PatientManagement() {
  const { patients, addPatient, updatePatient } = useData();
  const { user, displayName } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);

  const canEditSensitive = user?.role === 'administrador';

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setEditingPatient(null);
  };

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        name: editingPatient.name || '',
        phone: editingPatient.phone || '',
        cpf: editingPatient.cpf || '',
        responsibleName: editingPatient.responsibleName || '',
        responsiblePhone: editingPatient.responsiblePhone || '',
        diagnosis: editingPatient.diagnosis || '',
        homeDoctor: editingPatient.homeDoctor || '',
        patientDoctor: editingPatient.patientDoctor || '',
        hasGrades: editingPatient.hasGrades || 'nao',
        hasSeatbelt: editingPatient.hasSeatbelt || 'nao',
        hasAirMattress: editingPatient.hasAirMattress || 'nao',
        morseScale: editingPatient.morseScale || '',
        bradenScale: editingPatient.bradenScale || ''
      });
    } else {
      resetForm();
    }
  }, [editingPatient]);

  const validateForm = () => {
    const newErrors = { ...initialErrors };
    let isValid = true;
    
    if (!formData.name.trim()) { newErrors.name = "Nome é obrigatório."; isValid = false; }
    if (!formData.responsibleName.trim()) { newErrors.responsibleName = "Nome do responsável é obrigatório."; isValid = false; }
    
    const cpfCleaned = formData.cpf.replace(/\D/g, '');
    if (cpfCleaned.length !== 11) { newErrors.cpf = "CPF inválido. Deve conter 11 dígitos."; isValid = false; }

    const phoneCleaned = formData.phone.replace(/\D/g, '');
    if (phoneCleaned.length < 10 || phoneCleaned.length > 11) { newErrors.phone = "Telefone inválido."; isValid = false; }

    const respPhoneCleaned = formData.responsiblePhone.replace(/\D/g, '');
    if (respPhoneCleaned.length < 10 || respPhoneCleaned.length > 11) { newErrors.responsiblePhone = "Telefone do responsável inválido."; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Erro de Validação", description: "Por favor, corrija os campos marcados.", variant: "destructive" });
      return;
    }

    const dataToSave = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''),
      phone: formData.phone.replace(/\D/g, ''),
      responsiblePhone: formData.responsiblePhone.replace(/\D/g, '')
    };

    if (editingPatient) {
      updatePatient(editingPatient.id, dataToSave);
      toast({ title: "Sucesso!", description: "Paciente atualizado com sucesso." });
    } else {
      addPatient(dataToSave);
      toast({ title: "Sucesso!", description: "Paciente cadastrado com sucesso." });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  return (
    <Layout title="Gerenciar Pacientes" showBackButton={true}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center"><User className="h-6 w-6 mr-2" />Pacientes Cadastrados</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                  <DialogTrigger asChild><Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => setEditingPatient(null)}><UserPlus className="h-4 w-4 mr-2" />Novo Paciente</Button></DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>{editingPatient ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">Nome Completo</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={errors.name ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.name}</p></div>
                        <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" placeholder="000.000.000-00" value={formatCPF(formData.cpf)} onChange={(e) => setFormData({...formData, cpf: e.target.value})} className={errors.cpf ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.cpf}</p></div>
                        <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" placeholder="(00) 00000-0000" value={formatPhone(formData.phone)} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.phone}</p></div>
                        <div className="space-y-2"><Label htmlFor="responsibleName">Nome do Responsável</Label><Input id="responsibleName" value={formData.responsibleName} onChange={(e) => setFormData({...formData, responsibleName: e.target.value})} className={errors.responsibleName ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.responsibleName}</p></div>
                        <div className="space-y-2"><Label htmlFor="responsiblePhone">Telefone do Responsável</Label><Input id="responsiblePhone" placeholder="(00) 00000-0000" value={formatPhone(formData.responsiblePhone)} onChange={(e) => setFormData({...formData, responsiblePhone: e.target.value})} className={errors.responsiblePhone ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.responsiblePhone}</p></div>
                      </div>
                      <fieldset disabled={!canEditSensitive} className="border p-4 rounded-md space-y-4">
                        <legend className="text-sm font-medium px-1">Dados Clínicos (Apenas Administradores)</legend>
                        <div className="space-y-2"><Label htmlFor="diagnosis">Diagnóstico</Label><Textarea id="diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label htmlFor="homeDoctor">Médico da Casa</Label><Input id="homeDoctor" value={formData.homeDoctor} onChange={(e) => setFormData({...formData, homeDoctor: e.target.value})} /></div>
                          <div className="space-y-2"><Label htmlFor="patientDoctor">Médico do Paciente</Label><Input id="patientDoctor" value={formData.patientDoctor} onChange={(e) => setFormData({...formData, patientDoctor: e.target.value})} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2"><Label>Grades</Label><Select value={formData.hasGrades} onValueChange={(v) => setFormData({...formData, hasGrades: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
                          <div className="space-y-2"><Label>Cinto de Segurança</Label><Select value={formData.hasSeatbelt} onValueChange={(v) => setFormData({...formData, hasSeatbelt: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
                          <div className="space-y-2"><Label>Colchão de Ar</Label><Select value={formData.hasAirMattress} onValueChange={(v) => setFormData({...formData, hasAirMattress: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Escala de MORSE</Label><RadioGroup value={formData.morseScale} onValueChange={(v) => setFormData({...formData, morseScale: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="1" id="m1" /><Label htmlFor="m1">1</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="2" id="m2" /><Label htmlFor="m2">2</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="3" id="m3" /><Label htmlFor="m3">3</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="4" id="m4" /><Label htmlFor="m4">4</Label></div></RadioGroup></div>
                          <div className="space-y-2"><Label>Escala de BRADEN</Label><RadioGroup value={formData.bradenScale} onValueChange={(v) => setFormData({...formData, bradenScale: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="1" id="b1" /><Label htmlFor="b1">1</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="2" id="b2" /><Label htmlFor="b2">2</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="3" id="b3" /><Label htmlFor="b3">3</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="4" id="b4" /><Label htmlFor="b4">4</Label></div></RadioGroup></div>
                        </div>
                      </fieldset>
                      <div className="flex space-x-2 pt-4"><Button type="submit" className="flex-1">{editingPatient ? 'Atualizar' : 'Cadastrar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient, index) => (
            <motion.div key={patient.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary p-3 rounded-full"><User className="h-6 w-6 text-primary-foreground" /></div>
                      <div><h3 className="text-lg font-semibold text-foreground">{patient.name}</h3><p className="text-muted-foreground text-sm">CPF: {formatCPF(patient.cpf)}</p></div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(patient)}><Edit className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground text-sm"><Phone className="h-4 w-4 mr-2" />{formatPhone(patient.phone)}</div>
                    <div className="text-muted-foreground text-sm"><strong>Responsável:</strong> {patient.responsibleName}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}