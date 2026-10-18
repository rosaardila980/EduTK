/* =========================================================
   script.js — Aplikasi Manajemen Guru & Admin TK Kasih Bunda
   Tugas 5: JavaScript + jQuery (data dummy, belum ke backend)
   Dipakai oleh semua halaman; tiap bagian hanya aktif jika
   elemen yang dibutuhkan ada di halaman tersebut.
   ========================================================= */
"use strict";

/* ---------- 1. DATA DUMMY (array of object) ---------- */
const dataSiswa = [
  { nisn: "3141001", nama: "Aditya Pratama", kelas: "A" },
  { nisn: "3141002", nama: "Nadia Putri",    kelas: "A" },
  { nisn: "3141003", nama: "Raka Mahendra",  kelas: "B" },
  { nisn: "3141004", nama: "Sinta Maharani", kelas: "B" }
];

const dataPresensi = [
  { tanggal: "01 September 2026", status: "Hadir", catatan: "-" },
  { tanggal: "02 September 2026", status: "Izin",  catatan: "Acara keluarga" },
  { tanggal: "03 September 2026", status: "Hadir", catatan: "-" },
  { tanggal: "04 September 2026", status: "Sakit", catatan: "Flu ringan" },
  { tanggal: "05 September 2026", status: "Hadir", catatan: "-" }
];

const dataPerkembangan = [
  { aspek: "Motorik",          status: "Berkembang Sesuai Harapan", catatan: "Sudah mampu menggunting mengikuti pola garis lurus." },
  { aspek: "Kognitif",         status: "Berkembang Sangat Baik",    catatan: "Mampu mengenali dan mengurutkan angka 1-10." },
  { aspek: "Bahasa",           status: "Berkembang Sesuai Harapan", catatan: "Aktif bercerita menggunakan kalimat sederhana." },
  { aspek: "Sosial-Emosional", status: "Mulai Berkembang",          catatan: "Masih perlu bimbingan saat berbagi mainan dengan teman." }
];

const dataPengumuman = [
  { tanggal: "10 September 2026", judul: "Libur Tengah Semester",     isi: "Sekolah libur, kegiatan belajar diliburkan sementara." },
  { tanggal: "15 September 2026", judul: "Field Trip Kebun Binatang", isi: "Seluruh siswa Kelompok A & B mengikuti kunjungan edukatif." }
];

/* ---------- 2. FUNCTION PEMROSES DATA ---------- */

// Menghitung jumlah siswa per kelas (perulangan for...of)
function hitungPerKelas(daftar) {
  const hasil = { A: 0, B: 0, total: daftar.length };
  for (const siswa of daftar) {
    hasil[siswa.kelas]++;
  }
  return hasil;
}

// Memfilter siswa berdasarkan kata kunci (nama/NISN) dan kelas
function filterSiswa(daftar, kata, kelas) {
  const kunci = kata.trim().toLowerCase();
  return daftar.filter(function (s) {
    const cocokKata  = s.nama.toLowerCase().includes(kunci) || s.nisn.includes(kunci);
    const cocokKelas = kelas === "semua" || s.kelas === kelas;
    return cocokKata && cocokKelas;
  });
}

// Mengurutkan siswa berdasarkan nama atau NISN (tanpa mengubah array asli)
function urutkanSiswa(daftar, cara) {
  const salinan = daftar.slice();
  if (cara === "nisn") {
    salinan.sort((a, b) => a.nisn.localeCompare(b.nisn));
  } else {
    salinan.sort((a, b) => a.nama.localeCompare(b.nama));
  }
  return salinan;
}

// Merekap presensi: jumlah Hadir / Izin / Sakit / Alpha
function hitungPresensi(daftar) {
  const rekap = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
  for (const p of daftar) {
    if (rekap[p.status] !== undefined) {
      rekap[p.status]++;
    }
  }
  return rekap;
}

// Validasi data siswa baru -> mengembalikan daftar pesan error
function validasiSiswa(nama, nisn, kelas) {
  const error = [];
  if (nama === "") {
    error.push("Nama siswa wajib diisi.");
  }
  if (!/^[0-9]{7,10}$/.test(nisn)) {
    error.push("NISN harus berupa 7–10 digit angka.");
  } else if (dataSiswa.some(s => s.nisn === nisn)) {
    error.push("NISN " + nisn + " sudah terdaftar.");
  }
  if (kelas === "") {
    error.push("Kelas wajib dipilih.");
  }
  return error;
}

/* ---------- 3. HELPER TAMPILAN ---------- */

function rapikan(teks) {   // hapus spasi di awal/akhir
  return String(teks).trim();
}

function esc(teks) {   // cegah HTML injection saat data dirender
  return String(teks).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function warnaStatus(status) {
  switch (status) {
    case "Hadir":
    case "Berkembang Sangat Baik":    return "hijau";
    case "Berkembang Sesuai Harapan": return "biru";
    default:                          return "kuning";   // Izin, Sakit, Alpha, Mulai Berkembang
  }
}

function badge(teks) {
  return '<span class="badge rounded-pill ' + warnaStatus(teks) + '">' + esc(teks) + "</span>";
}

function baris(sel, tipe) {
  return '<tr><td colspan="' + sel + '" class="text-center text-secondary py-3">' + tipe + "</td></tr>";
}

// Notifikasi (jQuery fadeIn / fadeOut)
let timerNotif;
function tampilNotif(pesan, tipe) {
  const $n = $("#notifikasi");
  $n.stop(true, true)
    .removeClass("alert-success alert-danger alert-warning alert-info")
    .addClass("alert-" + tipe)
    .html(pesan)
    .fadeIn(200);
  clearTimeout(timerNotif);
  timerNotif = setTimeout(function () { $n.fadeOut(400); }, 3500);
}

function tandaiError($el, pesan) {
  $el.addClass("is-invalid");
  let $fb = $el.next(".invalid-feedback");
  if ($fb.length === 0) {
    $fb = $('<div class="invalid-feedback"></div>').insertAfter($el);
  }
  $fb.text(pesan);
}

/* ---------- 4. HALAMAN: DAFTAR SISWA (index.html) ---------- */

function barisSiswa(s, no) {
  return '<tr><td>' + no + '</td><td>' + esc(s.nama) + '</td><td>' + esc(s.nisn) + '</td><td class="text-nowrap">' +
    '<a class="btn btn-sm btn-outline-hijau" href="detail.html">Lihat Detail</a> ' +
    '<button type="button" class="btn btn-sm btn-outline-danger btn-hapus" data-nisn="' + esc(s.nisn) + '">Hapus</button>' +
    '</td></tr>';
}

function renderSiswa() {
  const hasil = urutkanSiswa(
    filterSiswa(dataSiswa, $("#cari-siswa").val(), $("#filter-kelas").val()),
    $("#urut-siswa").val()
  );

  ["A", "B"].forEach(function (k) {
    const $tbody = $("#tbody-kelompok-" + k.toLowerCase()).empty();
    const anggota = hasil.filter(s => s.kelas === k);
    if (anggota.length === 0) {
      $tbody.append(baris(4, "Tidak ada siswa ditemukan."));
    } else {
      anggota.forEach(function (s, i) { $tbody.append(barisSiswa(s, i + 1)); });
    }
  });

  const hitung = hitungPerKelas(dataSiswa);
  $("#stat-total").text(hitung.total);
  $("#stat-a").text(hitung.A);
  $("#stat-b").text(hitung.B);
  $("#stat-agenda").text(dataPengumuman.length);
  $("#badge-a").text(hitung.A + " siswa");
  $("#badge-b").text(hitung.B + " siswa");
}

function initIndex() {
  renderSiswa();

  $("#cari-siswa").on("input", renderSiswa);
  $("#filter-kelas, #urut-siswa").on("change", renderSiswa);

  // Tampil/sembunyi form tambah cepat
  $("#btn-toggle-form").on("click", function () {
    const $form = $("#form-cepat");
    $form.slideToggle(250, function () {
      $("#btn-toggle-form").text($form.is(":visible") ? "Tutup Form" : "+ Tambah Siswa Cepat");
    });
  });

  // Submit form tambah cepat: validasi lalu tambahkan ke array
  $("#form-cepat").on("submit", function (e) {
    e.preventDefault();
    const nama  = rapikan($("#cepat-nama").val());
    const nisn  = rapikan($("#cepat-nisn").val());
    const kelas = $("#cepat-kelas").val();

    const error = validasiSiswa(nama, nisn, kelas);
    if (error.length > 0) {
      tampilNotif(error.join("<br>"), "danger");
      return;
    }

    dataSiswa.push({ nisn: nisn, nama: nama, kelas: kelas });
    renderSiswa();
    this.reset();
    $("#form-cepat").slideUp(250);
    $("#btn-toggle-form").text("+ Tambah Siswa Cepat");
    tampilNotif("Siswa <strong>" + esc(nama) + "</strong> ditambahkan ke Kelompok " + kelas + ".", "success");
  });

  // Hapus siswa dari tampilan (event delegation karena baris dirender ulang)
  $(document).on("click", ".btn-hapus", function () {
    const nisn  = $(this).attr("data-nisn");
    const siswa = dataSiswa.find(s => s.nisn === nisn);
    if (!siswa) { return; }
    if (!window.confirm("Hapus data siswa " + siswa.nama + "?")) { return; }

    $(this).closest("tr").fadeOut(300, function () {
      dataSiswa.splice(dataSiswa.indexOf(siswa), 1);
      renderSiswa();
      tampilNotif("Data <strong>" + esc(siswa.nama) + "</strong> dihapus dari tampilan.", "warning");
    });
  });
}

/* ---------- 5. HALAMAN: FORM SISWA (form.html) ---------- */

function initForm() {
  const $form = $("#form-siswa");

  // Catatan presensi hanya muncul jika siswa tidak hadir
  $("#status-kehadiran").on("change", function () {
    if ($(this).val() !== "hadir") {
      $("#wrap-catatan").slideDown(200);
    } else {
      $("#wrap-catatan").slideUp(200);
    }
  });

  // Hilangkan tanda error saat field diperbaiki
  $form.on("input change", ".is-invalid", function () {
    $(this).removeClass("is-invalid").next(".invalid-feedback").remove();
  });

  $form.on("reset", function () {
    $form.find(".is-invalid").removeClass("is-invalid");
    $form.find(".invalid-feedback").remove();
    $("#wrap-catatan").slideUp(200);
  });

  $form.on("submit", function (e) {
    e.preventDefault();
    $form.find(".is-invalid").removeClass("is-invalid");
    $form.find(".invalid-feedback").remove();

    let jumlahError = 0;
    function wajib(selector, pesan) {
      const $el = $(selector);
      if (rapikan($el.val()) === "") { tandaiError($el, pesan); jumlahError++; return false; }
      return true;
    }

    wajib("#nama-siswa", "Nama siswa wajib diisi.");
    if (wajib("#nisn-siswa", "NISN wajib diisi.") && !/^[0-9]{7,10}$/.test(rapikan($("#nisn-siswa").val()))) {
      tandaiError($("#nisn-siswa"), "NISN harus berupa 7–10 digit angka.");
      jumlahError++;
    }
    wajib("#kelas-siswa", "Pilih kelas siswa.");
    wajib("#nama-ortu", "Nama orang tua/wali wajib diisi.");

    const kontak = rapikan($("#kontak-ortu").val());
    if (kontak !== "" && !/^[0-9+\- ]{8,15}$/.test(kontak)) {
      tandaiError($("#kontak-ortu"), "Nomor kontak tidak valid.");
      jumlahError++;
    }
    if ($("#status-kehadiran").val() !== "hadir") {
      wajib("#catatan-presensi", "Isi catatan untuk status izin/sakit/alpha.");
    }

    if (jumlahError > 0) {
      tampilNotif("Ada " + jumlahError + " isian yang belum benar. Periksa kolom yang ditandai merah.", "danger");
      $form.find(".is-invalid").first().trigger("focus");
      return;
    }

    const nama = rapikan($("#nama-siswa").val());
    tampilNotif("Data <strong>" + esc(nama) + "</strong> berhasil disimpan (simulasi, belum terhubung database).", "success");
    $form[0].reset();
  });
}

/* ---------- 6. HALAMAN: DETAIL SISWA & PORTAL ORANG TUA ---------- */

function renderPresensi(filter) {
  const $tbody = $("#tbody-presensi").empty();
  let tampil = 0;
  for (const p of dataPresensi) {
    if (filter !== "semua" && p.status !== filter) { continue; }
    $tbody.append("<tr><td>" + esc(p.tanggal) + "</td><td>" + badge(p.status) + "</td><td>" + esc(p.catatan) + "</td></tr>");
    tampil++;
  }
  if (tampil === 0) {
    $tbody.append(baris(3, "Tidak ada data presensi."));
  }
  const r = hitungPresensi(dataPresensi);
  $("#ringkasan-presensi").html(
    "Hadir: <strong>" + r.Hadir + "</strong> · Izin: <strong>" + r.Izin +
    "</strong> · Sakit: <strong>" + r.Sakit + "</strong> · Alpha: <strong>" + r.Alpha + "</strong>"
  );
}

function renderPerkembangan() {
  const $tbody = $("#tbody-laporan").empty();
  dataPerkembangan.forEach(function (d) {
    $tbody.append("<tr><td>" + esc(d.aspek) + "</td><td>" + badge(d.status) + "</td><td>" + esc(d.catatan) + "</td></tr>");
  });
}

function renderPengumuman() {
  const $tbody = $("#tbody-pengumuman").empty();
  dataPengumuman.forEach(function (a) {
    $tbody.append("<tr><td>" + esc(a.tanggal) + "</td><td>" + esc(a.judul) + "</td><td>" + esc(a.isi) + "</td></tr>");
  });
}

function initDetail() {
  renderPresensi("semua");
  renderPerkembangan();
  if ($("#tbody-pengumuman").length) { renderPengumuman(); }

  $("#filter-presensi").on("change", function () {
    renderPresensi($(this).val());
  });

  // Sembunyikan / tampilkan isi tiap kartu (slideToggle)
  $(".btn-toggle-card").on("click", function () {
    const $btn  = $(this);
    const $isi  = $btn.closest(".card-body").children().not(".header-card");
    $isi.slideToggle(250, function () {
      $btn.text($isi.first().is(":visible") ? "Sembunyikan" : "Tampilkan");
    });
  });
}

/* ---------- 7. HALAMAN: LOGIN ---------- */

function initLoginGuru() {
  $("#form-login-guru").on("submit", function (e) {
    const error = [];
    if (rapikan($("#username-guru").val()) === "") { error.push("Username wajib diisi."); }
    if ($("#password-guru").val() === "")         { error.push("Password wajib diisi."); }
    if ($("#peran").val() === "")                 { error.push("Pilih peran (Guru/Admin)."); }

    if (error.length > 0) {
      e.preventDefault();
      tampilNotif(error.join("<br>"), "danger");
    }
  });
}

function initLoginOrtu() {
  $("#form-login-ortu").on("submit", function (e) {
    const username = rapikan($("#username-ortu").val());
    const password = $("#password-ortu").val();
    let pesan = "";

    if (username === "" || password === "") {
      pesan = "Username dan password wajib diisi.";
    } else if (!/^[0-9]{7,10}$/.test(username)) {
      pesan = "Username harus berupa NISN (7–10 digit angka).";
    } else if (!dataSiswa.some(s => s.nisn === username)) {
      pesan = "NISN tidak terdaftar. Hubungi Admin sekolah.";
    } else if (password !== username) {
      pesan = "Password salah. Password sama dengan NISN anak.";
    }

    if (pesan !== "") {
      e.preventDefault();
      tampilNotif(pesan, "danger");
    }
  });
}

/* ---------- 8. INISIALISASI PER HALAMAN ---------- */
$(function () {
  if ($("#tbody-kelompok-a").length) { initIndex(); }
  if ($("#form-siswa").length)       { initForm(); }
  if ($("#tbody-presensi").length)   { initDetail(); }
  if ($("#form-login-guru").length)  { initLoginGuru(); }
  if ($("#form-login-ortu").length)  { initLoginOrtu(); }
});
