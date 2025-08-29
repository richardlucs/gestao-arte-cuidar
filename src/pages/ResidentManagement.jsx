
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, User, Edit, Phone, FileDown, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatCPF, formatPhone, exportToPDF, exportToExcel } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

const initialFormData = {
  name: '', phone: '', cpf: '', responsible_name: '', responsible_phone: '',
  diagnosis: '', home_doctor: '', resident_doctor: '',
  has_grades: false, has_seatbelt: false, has_air_mattress: false,
  morse_scale: '', braden_scale: ''
};

const initialErrors = {
  name: '', phone: '', cpf: '', responsible_name: '', responsible_phone: ''
};

export default function ResidentManagement() {
  const { residents, addResident, updateResident, deleteResident } = useData();
  const { user, signIn } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [editingResident, setEditingResident] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const navigate = useNavigate();

  const userRole = user?.profile?.role;
  const canEditSensitive = userRole === 'administrador';
  const canDelete = userRole === 'administrador';

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setEditingResident(null);
  };

  useEffect(() => {
    if (editingResident) {
      setFormData({
        name: editingResident.name || '',
        phone: editingResident.phone || '',
        cpf: editingResident.cpf || '',
        responsible_name: editingResident.responsible_name || '',
        responsible_phone: editingResident.responsible_phone || '',
        diagnosis: editingResident.diagnosis || '',
        home_doctor: editingResident.home_doctor || '',
        resident_doctor: editingResident.resident_doctor || '',
        has_grades: editingResident.has_grades,
        has_seatbelt: editingResident.has_seatbelt,
        has_air_mattress: editingResident.has_air_mattress,
        morse_scale: editingResident.morse_scale || '',
        braden_scale: editingResident.braden_scale || ''
      });
    } else {
      resetForm();
    }
  }, [editingResident]);

  const validateForm = () => {
    const newErrors = { ...initialErrors };
    let isValid = true;
    
    if (!formData.name.trim()) { newErrors.name = "Nome é obrigatório."; isValid = false; }
    if (!formData.responsible_name.trim()) { newErrors.responsible_name = "Nome do responsável é obrigatório."; isValid = false; }
    
    const cpfCleaned = formData.cpf.replace(/\D/g, '');
    if (cpfCleaned.length !== 11) { newErrors.cpf = "CPF inválido. Deve conter 11 dígitos."; isValid = false; }

    const phoneCleaned = formData.phone.replace(/\D/g, '');
    if (phoneCleaned.length < 10 || phoneCleaned.length > 11) { newErrors.phone = "Telefone inválido."; isValid = false; }

    const respPhoneCleaned = formData.responsible_phone.replace(/\D/g, '');
    if (respPhoneCleaned.length < 10 || respPhoneCleaned.length > 11) { newErrors.responsible_phone = "Telefone do responsável inválido."; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Erro de Validação", description: "Por favor, corrija os campos marcados.", variant: "destructive" });
      return;
    }

    const dataToSave = { ...formData };

    if (editingResident) {
      updateResident(editingResident.id, dataToSave);
      toast({ title: "Sucesso!", description: "Residente atualizado com sucesso." });
    } else {
      addResident(dataToSave);
      toast({ title: "Sucesso!", description: "Residente cadastrado com sucesso." });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (resident) => {
    setEditingResident(resident);
    setIsDialogOpen(true);
  };
  
  const handleDeleteRequest = (resident) => {
    setResidentToDelete(resident);
    setIsDeleteOpen(true);
  }

  const handleDeleteConfirm = async () => {
    const { error } = await signIn(user.email, passwordConfirm);
    if (error) {
      toast({ title: "Erro", description: "Senha incorreta. Exclusão cancelada.", variant: "destructive"});
      return;
    }
    deleteResident(residentToDelete.id);
    setIsDeleteOpen(false);
    setResidentToDelete(null);
    setPasswordConfirm('');
  };

  const handleExport = (format) => {
    const data = residents.map(r => ({
      'Nome': r.name,
      'CPF': formatCPF(r.cpf),
      'Telefone': formatPhone(r.phone),
      'Responsável': r.responsible_name,
      'Tel. Responsável': formatPhone(r.responsible_phone),
      'Diagnóstico': r.diagnosis || 'N/A',
      'Médico da Casa': r.home_doctor || 'N/A',
      'Médico do Residente': r.resident_doctor || 'N/A',
      'Grades': r.has_grades ? 'Sim' : 'Não',
      'Cinto de Segurança': r.has_seatbelt ? 'Sim' : 'Não',
      'Colchão de Ar': r.has_air_mattress ? 'Sim' : 'Não',
      'Escala MORSE': r.morse_scale || 'N/A',
      'Escala BRADEN': r.braden_scale || 'N/A',
    }));
    const headers = ['Nome', 'CPF', 'Telefone', 'Responsável', 'Tel. Responsável', 'Diagnóstico', 'Médico da Casa', 'Médico do Residente', 'Grades', 'Cinto de Segurança', 'Colchão de Ar', 'Escala MORSE', 'Escala BRADEN'];
    const title = "Relatório de Residentes";
    const sections = [{ title, data, headers }];

    if (format === 'pdf') {
      exportToPDF(title, sections);
    } else {
      exportToExcel(sections, 'relatorio_residentes');
    }
  };

  return (
    <Layout title="Gerenciar Residentes" showBackButton={true}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center"><User className="h-6 w-6 mr-2" />Residentes Cadastrados</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExport('pdf')}><FileDown className="h-4 w-4 mr-2" />PDF</Button>
                  <Button variant="outline" onClick={() => handleExport('excel')}><FileDown className="h-4 w-4 mr-2" />Excel</Button>
                  <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => setEditingResident(null)}><UserPlus className="h-4 w-4 mr-2" />Novo Residente</Button></DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader><DialogTitle>{editingResident ? 'Editar Residente' : 'Cadastrar Novo Residente'}</DialogTitle></DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label htmlFor="name">Nome Completo</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={errors.name ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.name}</p></div>
                          <div className="space-y-2"><Label htmlFor="cpf">CPF</Label><Input id="cpf" placeholder="000.000.000-00" value={formatCPF(formData.cpf)} onChange={(e) => setFormData({...formData, cpf: e.target.value})} className={errors.cpf ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.cpf}</p></div>
                          <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" placeholder="(00) 00000-0000" value={formatPhone(formData.phone)} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.phone}</p></div>
                          <div className="space-y-2"><Label htmlFor="responsible_name">Nome do Responsável</Label><Input id="responsible_name" value={formData.responsible_name} onChange={(e) => setFormData({...formData, responsible_name: e.target.value})} className={errors.responsible_name ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.responsible_name}</p></div>
                          <div className="space-y-2"><Label htmlFor="responsible_phone">Telefone do Responsável</Label><Input id="responsible_phone" placeholder="(00) 00000-0000" value={formatPhone(formData.responsible_phone)} onChange={(e) => setFormData({...formData, responsible_phone: e.target.value})} className={errors.responsible_phone ? 'border-red-500' : ''} /><p className="text-red-500 text-xs">{errors.responsible_phone}</p></div>
                        </div>
                        <fieldset disabled={!canEditSensitive} className="border p-4 rounded-md space-y-4"><legend className="text-sm font-medium px-1">Dados Clínicos (Apenas Administradores)</legend>
                          <div className="space-y-2"><Label htmlFor="diagnosis">Diagnóstico</Label><Textarea id="diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} /></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="home_doctor">Médico da Casa</Label><Input id="home_doctor" value={formData.home_doctor} onChange={(e) => setFormData({...formData, home_doctor: e.target.value})} /></div>
                            <div className="space-y-2"><Label htmlFor="resident_doctor">Médico do Residente</Label><Input id="resident_doctor" value={formData.resident_doctor} onChange={(e) => setFormData({...formData, resident_doctor: e.target.value})} /></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Grades</Label><Select value={formData.has_grades ? 'sim' : 'nao'} onValueChange={(v) => setFormData({...formData, has_grades: v === 'sim'})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Cinto de Segurança</Label><Select value={formData.has_seatbelt ? 'sim' : 'nao'} onValueChange={(v) => setFormData({...formData, has_seatbelt: v === 'sim'})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label>Colchão de Ar</Label><Select value={formData.has_air_mattress ? 'sim' : 'nao'} onValueChange={(v) => setFormData({...formData, has_air_mattress: v === 'sim'})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent></Select></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Escala de MORSE</Label><RadioGroup value={formData.morse_scale} onValueChange={(v) => setFormData({...formData, morse_scale: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="1" id="m1" /><Label htmlFor="m1">1</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="2" id="m2" /><Label htmlFor="m2">2</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="3" id="m3" /><Label htmlFor="m3">3</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="4" id="m4" /><Label htmlFor="m4">4</Label></div></RadioGroup></div>
                            <div className="space-y-2"><Label>Escala de BRADEN</Label><RadioGroup value={formData.braden_scale} onValueChange={(v) => setFormData({...formData, braden_scale: v})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="1" id="b1" /><Label htmlFor="b1">1</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="2" id="b2" /><Label htmlFor="b2">2</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="3" id="b3" /><Label htmlFor="b3">3</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="4" id="b4" /><Label htmlFor="b4">4</Label></div></RadioGroup></div>
                          </div>
                        </fieldset>
                        <div className="flex space-x-2 pt-4"><Button type="submit" className="flex-1">{editingResident ? 'Atualizar' : 'Cadastrar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {residents.map((resident, index) => (
                  <motion.div key={resident.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary p-3 rounded-full"><User className="h-6 w-6 text-primary-foreground" /></div>
                            <div><h3 className="text-lg font-semibold text-foreground">{resident.name}</h3><p className="text-muted-foreground text-sm">CPF: {formatCPF(resident.cpf)}</p></div>
                          </div>
                           <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(resident)}><Edit className="h-4 w-4" /></Button>
                            {canDelete && <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRequest(resident)}><Trash2 className="h-4 w-4"/></Button>}
                           </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-muted-foreground text-sm"><Phone className="h-4 w-4 mr-2" />{formatPhone(resident.phone)}</div>
                          <div className="text-muted-foreground text-sm"><strong>Responsável:</strong> {resident.responsible_name}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Residente</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o residente <strong>{residentToDelete?.name}</strong> e todo o seu histórico. Esta ação é irreversível. Para confirmar, digite sua senha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="password-confirm">Senha do Administrador</Label>
            <Input id="password-confirm" type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setPasswordConfirm(''); setIsDeleteOpen(false);}}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Excluir Residente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
