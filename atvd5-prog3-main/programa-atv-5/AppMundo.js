import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getExpoGoProjectConfig } from 'expo';

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';

import { auth, isFirebaseConfigurado } from './firebase';
import { mensagemErroFirebase } from './firebaseErrors';

const AppContext = createContext(null);

const Stack = createNativeStackNavigator();

const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  danger: '#DC2626',
  dangerDark: '#B91C1C',
  bg: '#E8EEF5',
  card: '#FFFFFF',
  text: '#0F172A',
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

const restCountriesBase = 'https://restcountries.com/v3.1';

function joinOrDash(value, joiner = ', ') {
  if (!value) return '—';
  if (Array.isArray(value)) {
    const clean = value.filter(Boolean).map(String);
    return clean.length ? clean.join(joiner) : '—';
  }
  return String(value);
}

function formatCurrencies(currencies) {
  if (!currencies || typeof currencies !== 'object') return '—';
  const entries = Object.values(currencies).map((c) => c?.name).filter(Boolean);
  return entries.length ? entries.join(', ') : '—';
}

function parseCountryListItem(item) {
  return {
    cca3: item?.cca3,
    name: item?.name?.common ?? '—',
    capital: joinOrDash(item?.capital, ', '),
    currencies: formatCurrencies(item?.currencies),
    flagsPng: item?.flags?.png,
    region: item?.region ?? '—',
  };
}

function BottomNav({ navigation, current }) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.bottomNavBtn}
        onPress={() => navigation.navigate('Home')}
        accessibilityLabel="Início"
      >
        <Ionicons name="home" size={22} color={current === 'Home' ? colors.primary : colors.muted} />
        <Text style={[styles.bottomNavLabel, current === 'Home' && { color: colors.primary }]}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomNavBtn}
        onPress={() => navigation.navigate('Favoritos')}
        accessibilityLabel="Favoritos"
      >
        <Ionicons
          name="heart"
          size={22}
          color={current === 'Favoritos' ? colors.primary : colors.muted}
        />
        <Text style={[styles.bottomNavLabel, current === 'Favoritos' && { color: colors.primary }]}>
          Favoritos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomNavBtn}
        onPress={() => navigation.navigate('Perfil')}
        accessibilityLabel="Perfil"
      >
        <Ionicons name="person-circle" size={22} color={current === 'Perfil' ? colors.primary : colors.muted} />
        <Text style={[styles.bottomNavLabel, current === 'Perfil' && { color: colors.primary }]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoginScreen({ navigation }) {
  const { signIn } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!isFirebaseConfigurado()) {
      Alert.alert(
        'Firebase não configurado',
        'Abra o arquivo firebaseConfig.js e cole as chaves do seu projeto no Firebase Console.'
      );
      return;
    }
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha login e senha');
      return;
    }
    try {
      setLoading(true);
      const ok = await signIn(email, senha);
      if (ok) navigation.replace('Home');
    } catch (e) {
      Alert.alert('Erro', mensagemErroFirebase(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex1}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.loginHeader}>
            <Ionicons name="globe" size={84} color={colors.primary} />
            <Text style={styles.screenTitle}>CONHECA O MUNDO</Text>
            <Text style={styles.subtitle}>Explore países e favorite destinos</Text>
          </View>

          {!isFirebaseConfigurado() ? (
            <View style={styles.firebaseAviso}>
              <Text style={styles.firebaseAvisoTexto}>
                Firebase ainda não configurado. Edite o arquivo firebaseConfig.js com as chaves do seu projeto.
              </Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
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

          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} activeOpacity={0.88} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('Cadastro')}
            activeOpacity={0.88}
          >
            <Text style={styles.btnOutlineText}>Cadastre-se</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CadastroScreen({ navigation }) {
  const { signUp, upsertProfileForNewUser } = useContext(AppContext);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCadastro = async () => {
    if (!isFirebaseConfigurado()) {
      Alert.alert(
        'Firebase não configurado',
        'Abra o arquivo firebaseConfig.js e cole as chaves do seu projeto no Firebase Console.'
      );
      return;
    }
    if (!nome || !email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const user = await signUp(email, senha);
      if (!user) return;

      await upsertProfileForNewUser(user.uid, user.email, nome);
      navigation.replace('Home');
    } catch (e) {
      Alert.alert('Erro', mensagemErroFirebase(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backFab} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>CADASTRO</Text>
        <Text style={styles.formHint}>Crie seu perfil</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor={colors.placeholder}
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
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

        <TouchableOpacity style={styles.btnPrimary} onPress={handleCadastro} activeOpacity={0.88} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Cadastrar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }) {
  const { profile, toggleFavorite } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [empty, setEmpty] = useState(false);

  const favoriteSet = useMemo(() => new Set(profile?.favoriteCca3Codes || []), [profile]);

  const fetchByName = async () => {
    const q = query.trim();
    if (!q) {
      Alert.alert('Atenção', 'Digite o nome do país');
      return;
    }
    setLoading(true);
    setEmpty(false);
    try {
      const fields = encodeURIComponent('name,capital,currencies,flags,cca3,region');
      const url = `${restCountriesBase}/name/${encodeURIComponent(q)}?fullText=true&fields=${fields}`;
      const res = await axios.get(url);
      const list = Array.isArray(res.data) ? res.data.map(parseCountryListItem) : [];
      setCountries(list);
      setEmpty(list.length === 0);
    } catch (e) {
      setCountries([]);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isFav = favoriteSet.has(item.cca3);
    return (
      <TouchableOpacity
        style={styles.countryCard}
        onPress={() => navigation.navigate('Detalhes', { cca3: item.cca3 })}
        activeOpacity={0.9}
      >
        <View style={styles.countryCardTop}>
          <Image source={{ uri: item.flagsPng }} style={styles.countryFlag} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryLine}>Capital: {item.capital}</Text>
            <Text style={styles.countryLine}>Moedas: {item.currencies}</Text>
          </View>
          <TouchableOpacity
            style={styles.favBtn}
            onPress={() => toggleFavorite(item.cca3)}
            accessibilityLabel="Favoritar"
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? colors.danger : colors.muted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.countryMeta}>Região: {item.region || '—'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex1}>
        <View style={styles.homeHeader}>
          <Text style={styles.homeTitle}>Países</Text>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Pesquisar país..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, color: colors.text }}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={fetchByName}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={fetchByName} activeOpacity={0.85}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={countries}
            keyExtractor={(it) => String(it.cca3)}
            contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
            ListEmptyComponent={
              empty ? <Text style={styles.emptyText}>Nenhum país encontrado.</Text> : null
            }
            renderItem={renderItem}
          />
        )}

        <BottomNav navigation={navigation} current="Home" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CountryDetailsScreen({ route }) {
  const { toggleFavorite, profile } = useContext(AppContext);
  const { cca3 } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const favoriteSet = useMemo(() => new Set(profile?.favoriteCca3Codes || []), [profile]);
  const isFav = favoriteSet.has(cca3);

  const fetchDetails = async () => {
    if (!cca3) return;
    setLoading(true);
    try {
      const fields = encodeURIComponent(
        'name,capital,currencies,flags,cca3,region,subregion,languages,area,population'
      );
      const url = `${restCountriesBase}/alpha/${encodeURIComponent(cca3)}?fields=${fields}`;
      const res = await axios.get(url);
      const item = res.data;
      setDetail({
        cca3: item?.cca3,
        name: item?.name?.common ?? '—',
        capital: joinOrDash(item?.capital, ', '),
        currencies: formatCurrencies(item?.currencies),
        flagsPng: item?.flags?.png,
        region: item?.region ?? '—',
        subregion: item?.subregion ?? '—',
        languages: joinOrDash(item?.languages ? Object.values(item.languages) : null, ', '),
        area: item?.area ? `${item.area} km2` : '—',
        population: item?.population ? String(item.population) : '—',
      });
    } catch (e) {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cca3]);

  if (loading || !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 26 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.detailTitle}>{detail.name}</Text>
          <TouchableOpacity style={styles.favBig} onPress={() => toggleFavorite(detail.cca3)}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={26}
              color={isFav ? colors.danger : colors.muted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailHero}>
          <Image source={{ uri: detail.flagsPng }} style={styles.detailFlag} />
        </View>

        <Text style={styles.detailLine}>Capital: {detail.capital}</Text>
        <Text style={styles.detailLine}>Moedas: {detail.currencies}</Text>
        <Text style={styles.detailLine}>Região: {detail.region}</Text>
        <Text style={styles.detailLine}>Sub-região: {detail.subregion}</Text>
        <Text style={styles.detailLine}>Idiomas: {detail.languages}</Text>
        <Text style={styles.detailLine}>População: {detail.population}</Text>
        <Text style={styles.detailLine}>Área: {detail.area}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FavoritesScreen({ navigation }) {
  const { profile, toggleFavorite } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [empty, setEmpty] = useState(false);

  const fetchAllFavDetails = async () => {
    const codes = profile?.favoriteCca3Codes || [];
    if (!codes.length) {
      setItems([]);
      setEmpty(true);
      return;
    }
    setLoading(true);
    setEmpty(false);
    try {
      const fields = encodeURIComponent('name,capital,currencies,flags,cca3,region');
      const requests = codes.map((code) =>
        axios.get(`${restCountriesBase}/alpha/${encodeURIComponent(code)}?fields=${fields}`)
      );
      const responses = await Promise.all(requests);
      const list = responses
        .map((r) => parseCountryListItem(r.data))
        .filter(Boolean);
      setItems(list);
      setEmpty(list.length === 0);
    } catch (e) {
      setItems([]);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFavDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.favoriteCca3Codes?.join('|')]);

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.countryCard}
        onPress={() => navigation.navigate('Detalhes', { cca3: item.cca3 })}
        activeOpacity={0.9}
      >
        <View style={styles.countryCardTop}>
          <Image source={{ uri: item.flagsPng }} style={styles.countryFlag} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryLine}>Capital: {item.capital}</Text>
            <Text style={styles.countryLine}>Moedas: {item.currencies}</Text>
          </View>
          <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(item.cca3)}>
            <Ionicons name="heart" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
        <Text style={styles.countryMeta}>Região: {item.region || '—'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.homeHeader}>
        <Text style={styles.homeTitle}>Meus Favoritos</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.cca3)}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          ListEmptyComponent={
            empty ? <Text style={styles.emptyText}>Você ainda não favoritou destinos.</Text> : null
          }
          renderItem={renderItem}
        />
      )}

      <BottomNav navigation={navigation} current="Favoritos" />
    </SafeAreaView>
  );
}

function ProfileScreen({ navigation }) {
  const { profile, signOutUser, updateProfile, refreshProfile } = useContext(AppContext);
  const [nome, setNome] = useState(profile?.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNome(profile?.displayName || '');
    setPhotoUrl(profile?.photoUrl || '');
  }, [profile?.displayName, profile?.photoUrl]);

  const handleSaveProfile = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite seu nome');
      return;
    }
    try {
      setSaving(true);
      await updateProfile({ displayName: nome.trim(), photoUrl: photoUrl.trim() });
      await refreshProfile();
      Alert.alert('Sucesso', 'Perfil atualizado');
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Não foi possível atualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        <View style={styles.profileTop}>
          <Image
            source={
              profile?.photoUrl
                ? { uri: profile.photoUrl }
                : { uri: 'https://placehold.co/200x200?text=Foto' }
            }
            style={styles.profilePhoto}
          />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.profileName}>{profile?.displayName || '—'}</Text>
            <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
            <Text style={styles.profileMeta}>
              Favoritos: {profile?.favoriteCca3Codes?.length || 0}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Alterar Foto</Text>
        <Text style={styles.sectionHint}>Cole uma URL de imagem</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={colors.placeholder}
          value={photoUrl}
          onChangeText={setPhotoUrl}
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveProfile} activeOpacity={0.88} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Salvar</Text>}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Alterar Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={colors.placeholder}
          value={nome}
          onChangeText={setNome}
        />

        <TouchableOpacity style={styles.btnOutline} onPress={handleSaveProfile} activeOpacity={0.88} disabled={saving}>
          <Text style={styles.btnOutlineText}>{saving ? 'Salvando...' : 'Atualizar Perfil'}</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />

        <TouchableOpacity
          style={styles.btnDanger}
          onPress={() => navigation.navigate('AlterarSenha')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnDangerText}>Alterar Senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={async () => {
            try {
              await signOutUser();
              navigation.replace('Login');
            } catch (e) {
              Alert.alert('Erro', e?.message || 'Falha ao sair');
            }
          }}
          activeOpacity={0.88}
        >
          <Text style={styles.btnOutlineText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav navigation={navigation} current="Perfil" />
    </SafeAreaView>
  );
}

function ChangePasswordScreen({ navigation }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [loading, setLoading] = useState(false);

  // Codigo novo pedido: alterar senha no Firebase
  async function alterarSenha(novaSenha) {
    try {
      const authInstance = getAuth();
      const user = authInstance.currentUser;

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      await updatePassword(user, novaSenha);

      return {
        success: true,
        message: 'Senha alterada com sucesso!',
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: mensagemErroFirebase(error),
      };
    }
  }

  const handleChangePassword = async () => {
    if (!novaSenha || !confirmacao) {
      Alert.alert('Atenção', 'Preencha a nova senha e a confirmação');
      return;
    }
    if (novaSenha !== confirmacao) {
      Alert.alert('Atenção', 'As senhas não são iguais');
      return;
    }

    try {
      setLoading(true);
      const result = await alterarSenha(novaSenha);
      if (result.success) {
        Alert.alert('Sucesso', result.message);
        navigation.goBack();
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (e) {
      Alert.alert('Erro', e?.message || 'Falha ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backFab} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>ALTERAR SENHA</Text>
        <Text style={styles.formHint}>Atualize sua senha do Firebase</Text>

        <TextInput
          style={styles.input}
          placeholder="Nova senha"
          placeholderTextColor={colors.placeholder}
          value={novaSenha}
          onChangeText={setNovaSenha}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar nova senha"
          placeholderTextColor={colors.placeholder}
          value={confirmacao}
          onChangeText={setConfirmacao}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleChangePassword}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Salvar Senha</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AppMundo() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!authUser) return;
    setProfileLoading(true);
    try {
      const res = await axios.get(apiUrl(`/users/${encodeURIComponent(authUser.uid)}`));
      setProfile(res.data);
    } catch (e) {
      // Se não existir no json-server, cria
      const userRecord = {
        id: authUser.uid,
        email: authUser.email || '',
        displayName: '',
        photoUrl: '',
        favoriteCca3Codes: [],
      };
      try {
        const created = await axios.post(apiUrl('/users'), userRecord);
        setProfile(created.data || userRecord);
      } catch (err) {
        setProfile(null);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authUser) refreshProfile();
  }, [authUser, refreshProfile]);

  const signIn = useCallback(async (email, senha) => {
    if (!auth) throw new Error('Firebase não configurado (firebaseConfig.js)');
    const result = await signInWithEmailAndPassword(auth, email, senha);
    return result?.user || null;
  }, []);

  const signUp = useCallback(async (email, senha) => {
    if (!auth) throw new Error('Firebase não configurado (firebaseConfig.js)');
    const result = await createUserWithEmailAndPassword(auth, email, senha);
    return result?.user || null;
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const upsertProfileForNewUser = useCallback(async (uid, email, displayName) => {
    const record = {
      id: uid,
      email: email || '',
      displayName: displayName || '',
      photoUrl: '',
      favoriteCca3Codes: [],
    };
    try {
      await axios.post(apiUrl('/users'), record);
    } catch (e) {
      await axios.patch(apiUrl(`/users/${encodeURIComponent(uid)}`), record);
    }
    setProfile(record);
  }, []);

  const updateProfile = useCallback(
    async ({ displayName, photoUrl }) => {
      if (!profile?.id) return;
      const patch = { displayName, photoUrl };
      await axios.patch(apiUrl(`/users/${encodeURIComponent(profile.id)}`), patch);
      setProfile((p) => ({ ...p, ...patch }));
    },
    [profile]
  );

  const toggleFavorite = useCallback(
    async (cca3Code) => {
      if (!profile?.id || !cca3Code) return;
      const favorites = Array.isArray(profile.favoriteCca3Codes) ? profile.favoriteCca3Codes : [];
      const isFav = favorites.includes(cca3Code);
      const nextFavorites = isFav ? favorites.filter((c) => c !== cca3Code) : [...favorites, cca3Code];
      const patch = { favoriteCca3Codes: nextFavorites };

      try {
        await axios.patch(apiUrl(`/users/${encodeURIComponent(profile.id)}`), patch);
        setProfile((p) => ({ ...p, favoriteCca3Codes: nextFavorites }));
      } catch (e) {
        Alert.alert('Erro', 'Nao foi possivel atualizar favoritos (json-server).');
      }
    },
    [profile]
  );

  const contextValue = useMemo(
    () => ({
      profile,
      authUser,
      signIn,
      signUp,
      signOutUser,
      upsertProfileForNewUser,
      updateProfile,
      toggleFavorite,
      refreshProfile,
    }),
    [
      profile,
      authUser,
      signIn,
      signUp,
      signOutUser,
      upsertProfileForNewUser,
      updateProfile,
      toggleFavorite,
      refreshProfile,
    ]
  );

  if (authLoading || (authUser && profileLoading)) {
    return (
      <SafeAreaProvider>
        <View style={styles.centerFull}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.muted }}>Carregando...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={authUser ? 'Home' : 'Login'} screenOptions={{ headerShown: false }}>
            {authUser ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Favoritos" component={FavoritesScreen} />
                <Stack.Screen name="Perfil" component={ProfileScreen} />
                <Stack.Screen name="Detalhes" component={CountryDetailsScreen} />
                <Stack.Screen name="AlterarSenha" component={ChangePasswordScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Cadastro" component={CadastroScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppContext.Provider>
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
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  formHint: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
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
    marginTop: 4,
    marginBottom: 10,
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
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerFull: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  homeHeader: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  homeTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 24,
    fontSize: 15,
    paddingHorizontal: 24,
  },
  countryCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCardTop: { flexDirection: 'row', alignItems: 'center' },
  countryFlag: { width: 54, height: 38, borderRadius: 6, backgroundColor: '#F1F5F9' },
  countryName: { fontSize: 18, fontWeight: '800', color: colors.text },
  countryLine: { marginTop: 3, fontSize: 14, color: colors.text },
  countryMeta: { marginTop: 10, color: colors.muted, fontSize: 13 },
  favBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favBig: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  detailHero: {
    marginTop: 12,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailFlag: { width: '100%', height: 220, resizeMode: 'cover' },
  detailLine: { marginTop: 10, fontSize: 15, color: colors.text, fontWeight: '600' },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 10,
  },
  bottomNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomNavLabel: { marginTop: 3, fontSize: 12, color: colors.muted, fontWeight: '700' },
  sectionTitle: { marginTop: 16, fontSize: 16, fontWeight: '900', color: colors.text },
  sectionHint: { marginTop: 6, fontSize: 13, color: colors.muted, marginBottom: 10 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  profilePhoto: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F1F5F9' },
  profileName: { fontSize: 20, fontWeight: '900', color: colors.text },
  profileEmail: { marginTop: 4, color: colors.muted },
  profileMeta: { marginTop: 10, fontSize: 13, color: colors.primaryDark, fontWeight: '700' },
  firebaseAviso: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  firebaseAvisoTexto: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
});

