require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const app = express();

// MongoDB Bağlantısı
mongoose.connect('mongodb+srv://mongo:mongo@cluster0.6us6keo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Cloudinary Yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Multer için Cloudinary Depolama Yapılandırması
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'musicApp',
    resource_type: 'auto',
  },
});

const upload = multer({ storage: storage });

// Şarkı Modeli
const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filePath: { type: String, required: true },
});
const Song = mongoose.model('Song', songSchema);

// Express Middleware ve Yapılandırmalar
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Anasayfa ve Şarkı Listeleme
app.get('/', async (req, res) => {
  const songs = await Song.find({});
  res.render('index', { songs });
});

// Şarkı Ekleme Sayfası
app.get('/ses', (req, res) => {
  res.render('add');
});

// Şarkı Yükleme Rotası
app.post('/add', upload.single('file'), async (req, res) => {
  const { title } = req.body;
  const song = new Song({
    title,
    filePath: req.file.path, // Cloudinary'den gelen dosya URL'si
  });
  await song.save();
  res.redirect('/');
});

// Sunucu Başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
