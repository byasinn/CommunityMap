# Mapa Comunitário

Aplicação web para criação e visualização colaborativa de marcadores em um mapa, com autenticação de usuários, perfis e seção de comunidade.

## Funcionalidades Principais

- Mapa interativo com marcadores categorizados por cores
- Criação de novos marcadores com popup
- Perfil de usuário com edição de foto, capa, nome, bio e cidade
- Seção de comunidade
- Autenticação via Firebase
- Clusterização de marcadores

## Tecnologias Utilizadas

- React
- Vite
- React Router
- Leaflet + React Leaflet
- React Leaflet Marker Cluster
- Firebase (Authentication, Firestore, Storage)

## Instalação e Execução

1. Clone o repositório:
   ```
   git clone https://github.com/byasinn/CommunityMap.git
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente Firebase no arquivo `.env` (baseado em `.env.example` se existir).

4. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

## Capturas de Tela

### Mapa Inicial com Marcadores
<a href="https://ibb.co/ks5tVLxr"><img src="https://i.ibb.co/PvFds2Nb/Captura-de-tela-2026-01-07-120004.png" alt="Captura-de-tela-2026-01-07-120004" border="0"></a>

### Aba Perfil
<a href="https://ibb.co/tT3fx9YD"><img src="https://i.ibb.co/HfXvxjGq/Captura-de-tela-2026-01-07-120017.png" alt="Captura-de-tela-2026-01-07-120017" border="0"></a>

### Aba Comunidade
<a href="https://ibb.co/Tx7YXDff"><img src="https://i.ibb.co/21CW2099/Captura-de-tela-2026-01-07-120030.png" alt="Captura-de-tela-2026-01-07-120030" border="0"></a>

### Popup de Criação de Novo Marcador
<a href="https://ibb.co/LdXQKH4R"><img src="https://i.ibb.co/1GtscjHQ/Captura-de-tela-2026-01-07-120137.png" alt="Captura-de-tela-2026-01-07-120137" border="0"></a>
