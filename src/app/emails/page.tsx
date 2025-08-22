"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Mail, 
  Plus, 
  Search, 
  Filter,
  Send,
  Archive,
  Trash2,
  Eye,
  Reply,
  Forward,
  Star,
  StarOff,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Email {
  id: number;
  from: string;
  to: string;
  subject: string;
  content: string;
  date: Date;
  status: "unread" | "read" | "archived" | "deleted";
  priority: "low" | "medium" | "high";
  category: "work" | "personal" | "urgent" | "spam";
  starred: boolean;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Form state for composing
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    content: ""
  });

  // Carregar dados mockados
  useEffect(() => {
    const dadosMockados: Email[] = [
      {
        id: 1,
        from: "ti@trt21.jus.br",
        to: "admin@trt21.jus.br",
        subject: "Manutenção Programada - Sistema PROAD",
        content: "Informamos que haverá manutenção programada no sistema PROAD no próximo sábado das 8h às 12h. Durante este período, o sistema ficará indisponível.",
        date: new Date(2024, 11, 20, 14, 30),
        status: "unread",
        priority: "high",
        category: "work",
        starred: true
      },
      {
        id: 2,
        from: "rh@trt21.jus.br",
        to: "admin@trt21.jus.br",
        subject: "Reunião de Equipe - Segunda-feira",
        content: "Lembramos que na segunda-feira às 9h haverá reunião de equipe para alinhamento das atividades da semana.",
        date: new Date(2024, 11, 20, 12, 15),
        status: "read",
        priority: "medium",
        category: "work",
        starred: false
      },
      {
        id: 3,
        from: "suporte@microsoft.com",
        to: "admin@trt21.jus.br",
        subject: "Atualização de Segurança - Office 365",
        content: "Uma nova atualização de segurança está disponível para o Office 365. Recomendamos a instalação o quanto antes.",
        date: new Date(2024, 11, 20, 10, 45),
        status: "read",
        priority: "high",
        category: "urgent",
        starred: true
      },
      {
        id: 4,
        from: "newsletter@tech.com",
        to: "admin@trt21.jus.br",
        subject: "Novidades em Tecnologia - Dezembro 2024",
        content: "Confira as principais novidades em tecnologia que aconteceram em dezembro de 2024.",
        date: new Date(2024, 11, 20, 9, 20),
        status: "read",
        priority: "low",
        category: "personal",
        starred: false
      }
    ];
    setEmails(dadosMockados);
  }, []);

  const handleInputChange = (field: keyof typeof composeData, value: string) => {
    setComposeData(prev => ({ ...prev, [field]: value }));
  };

  const resetComposeForm = () => {
    setComposeData({
      to: "",
      subject: "",
      content: ""
    });
  };

  const handleSendEmail = () => {
    if (!composeData.to || !composeData.subject || !composeData.content) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Simular envio de email
    const newEmail: Email = {
      id: Date.now(),
      from: "admin@trt21.jus.br",
      to: composeData.to,
      subject: composeData.subject,
      content: composeData.content,
      date: new Date(),
      status: "read",
      priority: "medium",
      category: "work",
      starred: false
    };

    setEmails(prev => [newEmail, ...prev]);
    setIsComposing(false);
    resetComposeForm();
    alert('Email enviado com sucesso!');
  };

  const toggleStar = (id: number) => {
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, starred: !email.starred } : email
    ));
  };

  const changeStatus = (id: number, newStatus: Email['status']) => {
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, status: newStatus } : email
    ));
  };

  const deleteEmail = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este email?')) {
      setEmails(prev => prev.filter(email => email.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Não lido</Badge>;
      case "read":
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Lido</Badge>;
      case "archived":
        return <Badge variant="outline" className="flex items-center gap-1"><Archive className="h-3 w-3" />Arquivado</Badge>;
      case "deleted":
        return <Badge variant="destructive" className="flex items-center gap-1"><Trash2 className="h-3 w-3" />Excluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Alta</Badge>;
      case "medium":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Média</Badge>;
      case "low":
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "work":
        return <Badge variant="default">Trabalho</Badge>;
      case "personal":
        return <Badge variant="secondary">Pessoal</Badge>;
      case "urgent":
        return <Badge variant="destructive">Urgente</Badge>;
      case "spam":
        return <Badge variant="outline">Spam</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  // Filtrar emails
  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || email.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || email.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calcular métricas
  const totalEmails = emails.length;
  const unreadEmails = emails.filter(e => e.status === "unread").length;
  const starredEmails = emails.filter(e => e.starred).length;
  const urgentEmails = emails.filter(e => e.priority === "high").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Emails</h1>
            <p className="text-muted-foreground mt-1">
              Gestão de Emails e Comunicações
            </p>
          </div>
          
          <Button onClick={() => setIsComposing(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Email
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmails}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Lidos</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadEmails}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{starredEmails}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{urgentEmails}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Categoria */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="work">Trabalho</SelectItem>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>

              {/* Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="unread">Não Lidos</SelectItem>
                  <SelectItem value="read">Lidos</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Composição */}
        {isComposing && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleSendEmail(); }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Para:</label>
                  <Input
                    placeholder="destinatario@exemplo.com"
                    value={composeData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Assunto:</label>
                  <Input
                    placeholder="Assunto do email"
                    value={composeData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Mensagem:</label>
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    value={composeData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={8}
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setIsComposing(false); resetComposeForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de Emails */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.length > 0 ? (
                    filteredEmails.map((email) => (
                      <TableRow key={email.id} className={`hover:bg-muted/50 ${email.status === 'unread' ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStar(email.id)}
                            className="h-6 w-6 p-0"
                          >
                            {email.starred ? (
                              <Star className="h-4 w-4 text-yellow-600 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{email.from}</TableCell>
                        <TableCell>{email.to}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={email.subject}>
                            {email.subject}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(email.date, "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{getStatusBadge(email.status)}</TableCell>
                        <TableCell>{getPriorityBadge(email.priority)}</TableCell>
                        <TableCell>{getCategoryBadge(email.category)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEmail(email)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeStatus(email.id, email.status === 'unread' ? 'read' : 'unread')}
                              className="h-8 w-8 p-0"
                            >
                              {email.status === 'unread' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeStatus(email.id, 'archived')}
                              className="h-8 w-8 p-0"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteEmail(email.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {emails.length === 0 ? "Nenhum email encontrado." : "Nenhum email encontrado com os filtros aplicados."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Visualização de Email */}
        {selectedEmail && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Visualizar Email</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedEmail(null)}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">De:</label>
                  <p className="text-sm">{selectedEmail.from}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Para:</label>
                  <p className="text-sm">{selectedEmail.to}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Assunto:</label>
                  <p className="text-sm font-medium">{selectedEmail.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Data:</label>
                  <p className="text-sm">{format(selectedEmail.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status:</label>
                  <div className="mt-1">{getStatusBadge(selectedEmail.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade:</label>
                  <div className="mt-1">{getPriorityBadge(selectedEmail.priority)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria:</label>
                  <div className="mt-1">{getCategoryBadge(selectedEmail.category)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Mensagem:</label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedEmail.content}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Reply className="h-4 w-4" />
                  Responder
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Forward className="h-4 w-4" />
                  Encaminhar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
