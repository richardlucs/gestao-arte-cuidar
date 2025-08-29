import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Phone, FileText } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/utils';

export default function PatientSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const { patients } = useData();
  const navigate = useNavigate();

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.cpf && patient.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')))
  );

  return (
    <Layout title="Buscar Pacientes" showBackButton={true}>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Search className="h-6 w-6 mr-2" />
                Pesquisar Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou CPF do paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                className="hover:border-primary transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/paciente/${patient.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-3 rounded-full group-hover:scale-110 transition-transform duration-300">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                      <p className="text-muted-foreground text-sm">CPF: {formatCPF(patient.cpf)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <User className="h-4 w-4 mr-2" />
                      Responsável: {patient.responsibleName}
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Phone className="h-4 w-4 mr-2" />
                      {formatPhone(patient.responsiblePhone)}
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/paciente/${patient.id}`);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Prontuário
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredPatients.length === 0 && searchTerm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum paciente encontrado</h3>
                <p className="text-muted-foreground">Tente pesquisar com um nome ou CPF diferente.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}