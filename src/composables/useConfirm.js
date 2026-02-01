import { ref } from 'vue';

const isVisible = ref(false);
const message = ref('');
const title = ref('確認');
let resolvePromise = null;

export function useConfirm() {
    const showConfirm = (msg, dialogTitle = '確認') => {
        message.value = msg;
        title.value = dialogTitle;
        isVisible.value = true;

        return new Promise((resolve) => {
            resolvePromise = resolve;
        });
    };

    const handleConfirm = () => {
        isVisible.value = false;
        if (resolvePromise) resolvePromise(true);
    };

    const handleCancel = () => {
        isVisible.value = false;
        if (resolvePromise) resolvePromise(false);
    };

    return {
        isVisible,
        message,
        title,
        showConfirm,
        handleConfirm,
        handleCancel
    };
}
