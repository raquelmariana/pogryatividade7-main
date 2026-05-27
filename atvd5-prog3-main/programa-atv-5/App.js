import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getExpoGoProjectConfig } from 'expo';

const Stack = createNativeStackNavigator();

const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  bg: '#E8EEF5',
  card: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#CBD5E1',
  placeholder: '#94A3B8',
};

function getApiBase() {
  const go = getExpoGoProjectConfig();
  const fromExpo = go?.debuggerHost?.split(':')[0];
  if (fromExpo) {
    return `http://${fromExpo}:3001`;
  }
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:3001`;
}

const apiUrl = (path) => `${getApiBase()}${path}`;

function contatoIdPath(id) {
  return encodeURIComponent(String(id));
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha login e senha');
      return;
    }
    try {
      const res = await axios.get(apiUrl(`/Cadastro?email=${encodeURIComponent(email)}`));
      const usuarios = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean);
      const ok = usuarios.some((u) => u.email === email && u.senha === senha);
      if (ok) {
        navigation.navigate('ListaContatos', { updated: true });
      } else {
        Alert.alert('Erro', 'Usuário ou senha inválidos');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginHeader}>
            <Ionicons name="person-circle" size={80} color={colors.primary} />
            <Text style={styles.screenTitle}>LOGIN</Text>
            <Text style={styles.subtitle}>Acesse com seu usuário</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Login"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.placeholder}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} activeOpacity={0.88}>
            <Text style={styles.btnPrimaryText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('CadastroUsuario')}
            activeOpacity={0.88}
          >
            <Text style={styles.btnOutlineText}>Cadastre-se</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ListaContatosScreen({ navigation, route }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContatos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl('/Contato'));
      setContacts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar contatos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContatos();
  }, []);

  useEffect(() => {
    if (route?.params?.updated) {
      fetchContatos();
    }
  }, [route?.params?.updated]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.listHeader}>
        <Text style={styles.screenTitle}>LISTA DE CONTATOS</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CadastroContato', { onSaved: () => fetchContatos() })}
          accessibilityLabel="Novo contato"
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          style={styles.listFlex}
          contentContainerStyle={styles.listContent}
          data={contacts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => navigation.navigate('DetalheContato', { contact: item })}
              activeOpacity={0.85}
            >
              <View style={styles.contactRow}>
                <Ionicons name="person-circle" size={44} color={colors.primary} style={styles.contactAvatar} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.nome}</Text>
                  <Text style={styles.contactPhone}>{item.telefone}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum contato cadastrado.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

function CadastroUsuarioScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSalvar = async () => {
    if (!nome || !cpf || !email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    try {
      await axios.post(apiUrl('/Cadastro'), { nome, cpf, email, senha });
      Alert.alert('Sucesso', 'Usuário cadastrado com sucesso', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar usuário');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backFab} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>CADASTRO DE USUÁRIOS</Text>
        <Text style={styles.formHint}>Campos obrigatórios</Text>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.placeholder} value={nome} onChangeText={setNome} />
        <TextInput style={styles.input} placeholder="CPF" placeholderTextColor={colors.placeholder} value={cpf} onChangeText={setCpf} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.placeholder} value={senha} onChangeText={setSenha} secureTextEntry />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSalvar} activeOpacity={0.88}>
          <Text style={styles.btnPrimaryText}>Salvar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function CadastroContatoScreen({ navigation, route }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleSalvar = async () => {
    if (!nome || !email || !telefone) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    try {
      await axios.post(apiUrl('/Contato'), { nome, email, telefone });
      Alert.alert('Sucesso', 'Contato cadastrado');
      if (route.params?.onSaved) {
        route.params.onSaved();
      }
      navigation.navigate('ListaContatos', { updated: true });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar contato');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backFab} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>CADASTRO DE CONTATO</Text>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.placeholder} value={nome} onChangeText={setNome} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput style={styles.input} placeholder="Telefone" placeholderTextColor={colors.placeholder} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSalvar} activeOpacity={0.88}>
          <Text style={styles.btnPrimaryText}>Salvar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetalheContatoScreen({ navigation, route }) {
  const contact = route?.params?.contact;
  const contactId = contact?.id;

  const [nome, setNome] = useState(contact?.nome ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [telefone, setTelefone] = useState(contact?.telefone ?? '');

  useEffect(() => {
    if (contact) {
      setNome(contact.nome ?? '');
      setEmail(contact.email ?? '');
      setTelefone(contact.telefone ?? '');
    }
  }, [contact]);

  const handleAlterar = async () => {
    if (!contactId) return;
    if (!nome || !email || !telefone) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    try {
      await axios.put(apiUrl(`/Contato/${contatoIdPath(contactId)}`), { nome, email, telefone });
      Alert.alert('Sucesso', 'Contato alterado');
      navigation.navigate('ListaContatos', { updated: true });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar contato');
    }
  };

  const executarExclusao = async (id) => {
    try {
      await axios.delete(apiUrl(`/Contato/${contatoIdPath(id)}`));
      Alert.alert('Sucesso', 'Contato excluído', [
        { text: 'OK', onPress: () => navigation.navigate('ListaContatos', { updated: true }) },
      ]);
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 404
          ? 'Contato não encontrado no servidor'
          : 'Não foi possível excluir o contato. Verifique se o json-server está rodando (npm run api).';
      Alert.alert('Erro', msg);
    }
  };

  const handleExcluir = () => {
    if (!contactId) {
      Alert.alert('Erro', 'Contato inválido');
      return;
    }
    const idParaExcluir = contactId;
    Alert.alert('Confirmar', 'Deseja excluir este contato?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          executarExclusao(idParaExcluir);
        },
      },
    ]);
  };

  if (!contactId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.formScroll}>
          <Text style={styles.emptyText}>Contato não encontrado.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()} activeOpacity={0.88}>
            <Text style={styles.btnPrimaryText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backFab} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>ALTERAÇÃO / EXCLUSÃO{'\n'}DE CONTATOS</Text>
        <TouchableOpacity style={styles.previewCard} activeOpacity={1}>
          <Text style={styles.previewName}>{nome || '—'}</Text>
          <Text style={styles.previewLine}>{telefone || '—'}</Text>
          <Text style={styles.previewLineMuted}>{email || '—'}</Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.placeholder} value={nome} onChangeText={setNome} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput style={styles.input} placeholder="Telefone" placeholderTextColor={colors.placeholder} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAlterar} activeOpacity={0.88}>
          <Text style={styles.btnPrimaryText}>Alterar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger} onPress={handleExcluir} activeOpacity={0.88}>
          <Text style={styles.btnDangerText}>Excluir</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ListaContatos" component={ListaContatosScreen} />
          <Stack.Screen name="CadastroUsuario" component={CadastroUsuarioScreen} />
          <Stack.Screen name="CadastroContato" component={CadastroContatoScreen} />
          <Stack.Screen name="DetalheContato" component={DetalheContatoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  formHint: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  listHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
  },
  listFlex: { flex: 1, width: '100%' },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loader: { marginTop: 24 },
  input: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.text,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  btnOutlineText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    shadowColor: colors.dangerDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnDangerText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  backFab: {
    alignSelf: 'flex-start',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  contactItem: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: { marginRight: 12 },
  contactInfo: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
    fontSize: 15,
  },
  previewCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  previewLine: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  previewLineMuted: {
    fontSize: 15,
    color: colors.muted,
  },
});

export default App;
