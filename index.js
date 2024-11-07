require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const songRoutes = require('./routes/songs');

const app = express();

mongoose.connect('mongodb+srv://mongo:mongo@cluster0.6us6keo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/songs', songRoutes);

app.get('/', async (req, res) => {
  const Song = require('./models/song');
  const songs = await Song.find({});
  res.render('index', { songs });
});
app.get('/ses', async (req, res) => {
  const Song = require('./models/song');
  const songs = await Song.find({});
  res.render('add', { songs });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
