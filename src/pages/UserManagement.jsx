
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, User, Shield, Edit, Trash2, UserCog, Users, Briefcase, Stethoscope } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useData } from '@/contexts/DataContext';

const initialFormState = { 
  name: '', email: '', phone: '', password: '', role: '', 
  cpf_cnpj: '', occupation: '', professional_register: ''
};

export default function UserManagement() {
  const { user: loggedInUser } = useAuth();
  const { users, addUser, updateUser, deleteUser, loading } = useData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const userRole = loggedInUser?.profile?.role;
  
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingUser(null);
  };

  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      toast({ title: "Erro", description: "Por favor, preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    if (editingUser) {
        await updateUser(editingUser.id, formData);
        toast({ title: "Sucesso!", description: `Usuário ${formData.name} atualizado.` });
    } else {
        if (!formData.password) {
            toast({ title: "Erro", description: "Senha é obrigatória para novos usuários.", variant: "destructive" });
            return;
        }
        const result = await addUser(formData);
        if (result) {
          toast({ title: "Sucesso!", description: `Usuário ${formData.name} cadastrado.` });
        }
    }
    
    setIsDialogOpen(false);
  };

  const handleEditClick = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({ ...initialFormState, ...userToEdit, password: '' });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (userId) => {
    deleteUser(userId);
    toast({ title: "Sucesso", description: "Usuário removido." });
  };

  const getRoleDisplay = (role) => ({
    supervisor: 'Supervisor',
    cuidador: 'Cuidador',
    administrador: 'Administrador',
    medico_geriatra: 'Médico Geriatra',
    terceirizado: 'Terceirizado'
  }[role] || role);

  const getRoleIcon = (role) => {
    switch(role) {
      case 'administrador': return <Shield className="h-6 w-6 text-white" />;
      case 'supervisor': return <UserCog className="h-6 w-6 text-white" />;
      case 'medico_geriatra': return <Stethoscope className="h-6 w-6 text-white" />;
      case 'terceirizado': return <Briefcase className="h-6 w-6 text-white" />;
      default: return <User className="h-6 w-6 text-white" />;
    }
  }
  
  const getRoleColor = (role) => {
    switch(role) {
      case 'administrador': return 'bg-purple-600';
      case 'supervisor': return 'bg-destructive';
      case 'medico_geriatra': return 'bg-blue-600';
      case 'terceirizado': return 'bg-orange-500';
      default: return 'bg-primary';
    }
  }
  
  if (loading) {
    return <Layout title="Gerenciar Usuários" showBackButton={true}><p>Carregando usuários...</p></Layout>
  }
  
  return (
    <Layout title="Gerenciar Usuários" showBackButton={true}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center"><Users className="h-6 w-6 mr-2" />Usuários do Sistema</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild><Button className="bg-blue-500 hover:bg-blue-600 text-white"><UserPlus className="h-4 w-4 mr-2" />Novo Usuário</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">Nome Completo *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                        <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                        <div className="space-y-2"><Label htmlFor="phone">Telefone *</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                        <div className="space-y-2"><Label htmlFor="password">Senha *</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? 'Deixe em branco para não alterar' : ''} /></div>
                        <div className="space-y-2"><Label htmlFor="role">Função *</Label>
                          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                            <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                            <SelectContent>
                              {userRole === 'administrador' && <SelectItem value="administrador">Administrador</SelectItem>}
                              {(userRole === 'administrador' || userRole === 'supervisor') && <SelectItem value="supervisor">Supervisor</SelectItem>}
                              <SelectItem value="cuidador">Cuidador</SelectItem>
                              <SelectItem value="medico_geriatra">Médico Geriatra</SelectItem>
                              <SelectItem value="terceirizado">Terceirizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        { (formData.role === 'medico_geriatra' || formData.role === 'terceirizado') &&
                          <div className="space-y-2"><Label htmlFor="cpf_cnpj">CPF/CNPJ</Label><Input id="cpf_cnpj" value={formData.cpf_cnpj} onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})} /></div>
                        }
                        { formData.role === 'medico_geriatra' &&
                          <div className="space-y-2"><Label htmlFor="professional_register">Registro Profissional</Label><Input id="professional_register" value={formData.professional_register} onChange={(e) => setFormData({...formData, professional_register: e.target.value})} /></div>
                        }
                        { formData.role === 'terceirizado' &&
                           <div className="space-y-2"><Label htmlFor="occupation">Ocupação</Label><Input id="occupation" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} /></div>
                        }
                      </div>
                      <div className="flex space-x-2"><Button type="submit" className="flex-1" disabled={loading}>{editingUser ? 'Atualizar' : 'Cadastrar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button></div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users && users.map(userItem => (
                        <motion.div key={userItem.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-full ${getRoleColor(userItem.role)}`}>{getRoleIcon(userItem.role)}</div>
                                        <div>
                                            <CardTitle className="text-lg">{userItem.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{getRoleDisplay(userItem.role)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(userItem)}><Edit className="h-4 w-4"/></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>Essa ação não pode ser desfeita. Isso removerá permanentemente o usuário.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteClick(userItem.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
