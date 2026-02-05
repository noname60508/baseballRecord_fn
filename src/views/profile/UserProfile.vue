<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import userService from '@/services/UserService';
import authService from '@/services/authService';
import { useToast } from '@/composables/useToast';

// Components
import BaseModal from '@/components/ui/BaseModal.vue';
import TeamsCRUD from '@/views/masterData/TeamsCRUD.vue';
import SeasonsCRUD from '@/views/masterData/SeasonsCRUD.vue';
import FieldsCRUD from '@/views/masterData/FieldsCRUD.vue';

const authStore = useAuthStore();
const { t } = useI18n();
const toast = useToast();

const isEditingProfile = ref(false);
const isChangingPassword = ref(false);
const isLoading = ref(true);
const user = ref(null);

// Tab State
const activeTab = ref('teams'); // teams, seasons, fields

const formData = ref({
  name: '',
  email: '',
  iconFile: null
});

const passwordForm = ref({
  password: '',
  newPassword: '',
  confirmPassword: ''
});

const previewIcon = ref(null);

const fetchUserProfile = async () => {
  isLoading.value = true;
  try {
    const userId = localStorage.getItem('userId');
    const finalId = userId ? userId : (authStore.user ? authStore.user.id : null);
    
    if (finalId) {
      const response = await userService.getUser(finalId);
      const userData = response.data.result;
      if (userData.icon) {
        userData.icon = `${userData.icon}${userData.icon.includes('?') ? '&' : '?'}t=${Date.now()}`;
      }
      user.value = userData; 
      
      // Initialize form data
      formData.value.name = user.value.name;
      formData.value.email = user.value.email;
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.iconFile = file;
    previewIcon.value = URL.createObjectURL(file);
  }
};

onMounted(() => {
  fetchUserProfile();
});

const openEditProfile = () => {
   if (user.value) {
        formData.value.name = user.value.name;
        formData.value.email = user.value.email;
    }
    previewIcon.value = null;
    formData.value.iconFile = null;
    isEditingProfile.value = true;
};

const openChangePassword = () => {
    passwordForm.value.password = '';
    passwordForm.value.newPassword = '';
    passwordForm.value.confirmPassword = '';
    isChangingPassword.value = true;
};

const handleProfileSave = async () => {
  if (!user.value) return;
  
  try {
    // 1. Update Basic Info (PUT)
    const basicData = {
        name: formData.value.name,
        email: formData.value.email
    };
    await userService.updateUser(user.value.id, basicData);

    // 2. Update Icon if new file selected (POST)
    if (formData.value.iconFile) {
        const iconData = new FormData();
        iconData.append('icon', formData.value.iconFile);
        iconData.append('id', user.value.id);
        await userService.updateIcon(iconData);
    }
    
    await fetchUserProfile();
    // Update global auth store to sync header/sidebar icons
    await authStore.fetchUser();
    isEditingProfile.value = false;
    toast.success('個人資料已更新');
  } catch (error) {
    console.error('Update profile failed:', error);
  }
};

const handlePasswordSave = async () => {
  if (!user.value) return;
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('新密碼不一致');
    return;
  }

  try {
    const passwordData = {
      id: localStorage.getItem('userId'),
      password: passwordForm.value.password,
      newPassword: passwordForm.value.newPassword
    };
    
    await userService.updatePassword(passwordData);
    
    isChangingPassword.value = false;
  } catch (error) {
    console.error('Update password failed:', error);
  }
};

const handleSendVerification = async () => {
  if (!user.value || !user.value.email) return;
  
  try {
      await authService.sendVerificationEmail();
  } catch (error) {
      console.error('Failed to send verification email:', error);
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8">
    <h1 class="page-title !mb-0">
      <span class="text-cyan-500">👤</span>
      {{ t('nav.profile') }}
    </h1>

    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Profile Card -->
    <div v-else-if="user" class="card relative overflow-hidden">
      <!-- Background Effect -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -z-10"></div>

      <div class="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div class="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 text-center md:text-left">
          <div class="relative group">
            <div class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/30 overflow-hidden border-4 border-gray-800">
              <img v-if="user.icon" :src="user.icon" alt="User Icon" class="w-full h-full object-cover">
              <span v-else>{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</span>
            </div>
            <!-- Verification Badge -->
             <div class="absolute bottom-1 right-1 bg-gray-900 rounded-full p-1 border border-gray-700" :title="user.email_verified_at ? '已驗證' : '未驗證'">
               <svg v-if="user.email_verified_at" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
             </div>
          </div>
          
          <div class="space-y-1">
            <h2 class="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              {{ user.name }}
            </h2>
            <p class="text-blue-400 font-medium text-sm">@{{ user.account }}</p>
            <p class="text-gray-400 text-sm flex items-center justify-center md:justify-start gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {{ user.email }}
            </p>
          </div>
        </div>
        
        <div class="flex flex-wrap justify-center gap-3">
          <button 
            @click="openEditProfile"
            class="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-500/20"
          >
            {{ t('profile.editProfile') }}
          </button>
           <button 
            @click="openChangePassword"
            class="btn-ghost text-sm py-2 px-4 border border-white/10 hover:bg-white/5"
          >
            {{ t('profile.changePassword') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modals -->
    <!-- Edit Profile Modal -->
    <BaseModal :isOpen="isEditingProfile" :title="t('profile.editProfile')" @close="isEditingProfile = false">
      <form @submit.prevent="handleProfileSave" class="space-y-6">
        <!-- Icon -->
        <div class="flex flex-col items-center justify-center space-y-4">
            <div class="relative group cursor-pointer" @click="$refs.fileInput.click()">
            <div class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/30 overflow-hidden border-4 border-gray-800 hover:border-gray-600 transition-colors">
                <img v-if="previewIcon" :src="previewIcon" alt="New Icon Preview" class="w-full h-full object-cover">
                <img v-else-if="user.icon" :src="user.icon" alt="Current Icon" class="w-full h-full object-cover">
                <span v-else>{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</span>
                
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                </div>
            </div>
            </div>
            <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange">
            <p class="text-xs text-gray-500">{{ t('profile.updateIcon') }}</p>
        </div>

        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('profile.name') }}</label>
                <input v-model="formData.name" type="text" required class="input-field w-full">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('profile.email') }}</label>
                <div class="flex gap-2">
                    <input v-model="formData.email" type="email" required class="input-field w-full">
                    <button type="button" @click="handleSendVerification" class="btn-ghost whitespace-nowrap px-3 border border-white/10" :title="t('profile.sendVerification')">
                        {{ t('profile.sendVerification') }}
                    </button>
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" class="btn-ghost" @click="isEditingProfile = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary">{{ t('common.save') }}</button>
        </div>
      </form>
    </BaseModal>

    <!-- Change Password Modal -->
    <BaseModal :isOpen="isChangingPassword" :title="t('profile.changePassword')" @close="isChangingPassword = false">
      <form @submit.prevent="handlePasswordSave" class="space-y-6">
         <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('profile.currentPassword') }}</label>
                <input v-model="passwordForm.password" type="password" required class="input-field w-full">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('profile.newPassword') }}</label>
                <input v-model="passwordForm.newPassword" type="password" required class="input-field w-full">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('profile.confirmPassword') }}</label>
                <input v-model="passwordForm.confirmPassword" type="password" required class="input-field w-full">
            </div>
         </div>
         <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" class="btn-ghost" @click="isChangingPassword = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary">{{ t('common.save') }}</button>
         </div>
      </form>
    </BaseModal>

    <!-- Master Data Section -->
    <div class="space-y-6">
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <span class="text-blue-500">📂</span>
            {{ t('nav.masterData') }}
        </h2>
        
        <!-- Tabs -->
        <div class="flex space-x-1 bg-gray-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
            <button 
                @click="activeTab = 'teams'"
                class="flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :class="activeTab === 'teams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'"
            >
                {{ t('nav.teams') }}
            </button>
            <button 
                @click="activeTab = 'seasons'"
                class="flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :class="activeTab === 'seasons' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'"
            >
                {{ t('nav.seasons') }}
            </button>
            <button 
                @click="activeTab = 'fields'"
                class="flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                :class="activeTab === 'fields' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'"
            >
                {{ t('nav.fields') }}
            </button>
        </div>

        <!-- content -->
        <div class="card bg-gray-900/50 border border-white/5 min-h-[400px]">
            <Transition mode="out-in" enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                <TeamsCRUD v-if="activeTab === 'teams'" />
                <SeasonsCRUD v-else-if="activeTab === 'seasons'" />
                <FieldsCRUD v-else-if="activeTab === 'fields'" />
            </Transition>
        </div>
    </div>
  </div>
</template>
