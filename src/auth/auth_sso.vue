<template>
  <div class="text-center mt-5">
    <p>Login SSO sedang diproses...</p>
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
</template>

<script>
import axios from '@/utils/axiosEncrypt.js';
import { userLevelUmum } from "@/constants/userLevels";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";

export default {
  name: 'auth-sso',
  setup() {
    const toast = useToast();
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    // Fungsi login SSO
    const loginWithSSO = async (ssoToken, ssoRefreshToken, access_token) => {
      try {
        const response = await axios.get(`/auth_sso`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });

        const user = response.data?.data?.user;
        if (!user) {
          toast.error("Data user tidak ditemukan.");
          router.push("/auth");
          return;
        }

        // Normal login success
        localStorage.setItem('token', access_token);
        localStorage.setItem("userData", JSON.stringify({ data: [user] }));
        toast.success(`Login berhasil! Selamat datang, ${user.nama || "Pengguna"}`);

        const userLevel = user.id_level ?? user.roles?.id_level;
        store.dispatch("menu/refreshMenuByUserLevel");
        router.push(userLevel === userLevelUmum ? "/my-profile" : "/");

      } catch (error) {
        // Tangani error dari backend
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 423 || data?.code === "ACCOUNT_INACTIVE") {
          // Tampilkan Swal untuk akun non aktif
          Swal.fire({
            icon: "warning",
            title: "Akun Non-Aktif",
            text: data?.message || "Akun Anda non-aktif, silakan aktivasi.",
            showCancelButton: true,
            confirmButtonText: "Kirim Link Aktivasi",
            cancelButtonText: "Batal",
            allowOutsideClick: false
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                await axios.post("/resend-activation", { email: data?.email });

                Swal.fire({
                  icon: "success",
                  title: "Berhasil",
                  text: "Link aktivasi telah dikirim ke email Anda.",
                  confirmButtonText: "OK"
                }).then(() => {
                  router.push("/auth"); // redirect ke halaman login setelah klik OK
                });

              } catch (err) {
                Swal.fire({
                  icon: "error",
                  title: "Gagal",
                  text: err.response?.data?.message || "Gagal mengirim link aktivasi.",
                  confirmButtonText: "OK"
                }).then(() => {
                  router.push("/auth"); // redirect ke halaman login setelah klik OK
                });
              }
            }
          });

          return; // hentikan proses login lebih lanjut
        }

        // Jika error lain
        toast.error(data?.message || "Login gagal. Token tidak ditemukan.");
        router.push("/auth");
      }
    };


    // Saat mounted, ambil query params dari route
    const ssoToken = route.query.token;
    const ssoRefreshToken = route.query.refresh_token;
    const access_token = route.query.access_token;

    if (ssoToken && ssoRefreshToken && access_token) {
      loginWithSSO(ssoToken, ssoRefreshToken, access_token);
    } else {
      toast.error("Token SSO tidak ditemukan.");
      router.push("/auth"); // fallback ke login
    }

    return { loginWithSSO };
  }
};
</script>

<style scoped>
.text-center {
  text-align: center;
  margin-top: 100px;
}
</style>
