const { createApp, reactive, ref, onMounted } = Vue;

createApp({
  setup() {
    const me = ref(null);
    const posts = ref([]);
    const comments = ref([]);
    const selectedPost = ref(null);

    const page = ref(1);
    const limit = ref(10);

    const showCreate = ref(false);
    const editingPost = ref(false);
    const showRegisterModal = ref(false);

    const loginForm = reactive({ username: '', password: '' });
    const registerForm = reactive({ username: '', password: '', nickname: '', email: '' });
    const createPostForm = reactive({ title: '', content: '' });
    const editPostForm = reactive({ title: '', content: '' });
    const commentForm = reactive({ content: '' });

    const loading = reactive({
      login: false,
      register: false,
      posts: false,
      createPost: false,
      updatePost: false,
      deletePost: false,
      createComment: false,
    });

    const toast = reactive({ message: '', type: 'ok', timer: null });

    function showToast(message, type = 'ok') {
      toast.message = message;
      toast.type = type;
      if (toast.timer) clearTimeout(toast.timer);
      toast.timer = setTimeout(() => { toast.message = ''; }, 2500);
    }

    async function api(path, options = {}) {
      const res = await fetch(path, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      let body = null;
      try { body = await res.json(); } catch (_) {}

      if (!res.ok || (body && body.success === false)) {
        const msg = body?.message || `요청 실패 (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return body;
    }

    function fmt(v) {
      if (!v) return '-';
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toLocaleString('ko-KR');
    }

    function truncateTitle(title) {
      if (!title) return '';
      return title.length > 25 ? `${title.slice(0, 25)}…` : title;
    }

    function goToLogin() {
      const el = document.getElementById('account-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function fetchMe() {
      try {
        const r = await api('/api/me');
        me.value = r.data;
      } catch (_) {
        me.value = null;
      }
    }

    async function login() {
      if (!loginForm.username || !loginForm.password) return showToast('아이디/비밀번호를 입력하세요', 'error');
      loading.login = true;
      try {
        await api('/api/login', { method: 'POST', body: JSON.stringify(loginForm) });
        await fetchMe();
        showToast('로그인 성공');
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.login = false;
      }
    }

    async function logout() {
      try { await api('/api/logout', { method: 'POST' }); } catch (_) {}
      me.value = null;
      showToast('로그아웃되었습니다');
    }

    function openRegisterModal() {
      showRegisterModal.value = true;
    }

    function closeRegisterModal() {
      showRegisterModal.value = false;
    }

    async function register() {
      if (!registerForm.username || !registerForm.password || !registerForm.nickname) {
        return showToast('회원가입 필수값을 입력하세요', 'error');
      }
      loading.register = true;
      try {
        await api('/api/users', { method: 'POST', body: JSON.stringify(registerForm) });
        showToast('회원가입 성공! 로그인해주세요.');
        Object.assign(registerForm, { username: '', password: '', nickname: '', email: '' });
        closeRegisterModal();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.register = false;
      }
    }

    async function fetchPosts() {
      loading.posts = true;
      try {
        const r = await api(`/api/posts?page=${page.value}&limit=${limit.value}`);
        posts.value = Array.isArray(r.data) ? r.data : [];
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.posts = false;
      }
    }

    async function createPost() {
      if (!me.value) return showToast('로그인이 필요합니다', 'error');
      if (!createPostForm.title || !createPostForm.content) return showToast('제목/내용을 입력하세요', 'error');
      if (createPostForm.title.length > 25) return showToast('제목은 25자 이내로 입력해주세요', 'error');

      loading.createPost = true;
      try {
        await api('/api/posts', { method: 'POST', body: JSON.stringify(createPostForm) });
        showToast('게시글이 등록되었습니다');
        Object.assign(createPostForm, { title: '', content: '' });
        showCreate.value = false;
        await fetchPosts();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.createPost = false;
      }
    }

    async function openPost(id) {
      try {
        const r = await api(`/api/posts/${id}`);
        selectedPost.value = r.data;
        editingPost.value = false;
        await fetchComments();
      } catch (e) {
        showToast(e.message, 'error');
      }
    }

    function closePost() {
      selectedPost.value = null;
      comments.value = [];
      commentForm.content = '';
      editingPost.value = false;
    }

    function startEditPost() {
      if (!selectedPost.value) return;
      editPostForm.title = selectedPost.value.title || '';
      editPostForm.content = selectedPost.value.content || '';
      editingPost.value = true;
    }

    async function updatePost() {
      if (!selectedPost.value) return;
      if ((editPostForm.title || '').length > 25) return showToast('제목은 25자 이내로 입력해주세요', 'error');
      loading.updatePost = true;
      try {
        const r = await api(`/api/posts/${selectedPost.value.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: editPostForm.title, content: editPostForm.content })
        });
        selectedPost.value = r.data;
        editingPost.value = false;
        showToast('게시글이 수정되었습니다');
        await fetchPosts();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.updatePost = false;
      }
    }

    async function deletePost() {
      if (!selectedPost.value) return;
      if (!confirm('정말 삭제하시겠습니까?')) return;
      loading.deletePost = true;
      try {
        await api(`/api/posts/${selectedPost.value.id}`, { method: 'DELETE' });
        showToast('게시글이 삭제되었습니다');
        closePost();
        await fetchPosts();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.deletePost = false;
      }
    }

    async function fetchComments() {
      if (!selectedPost.value) return;
      try {
        const r = await api(`/api/posts/${selectedPost.value.id}/comments?limit=50`);
        comments.value = Array.isArray(r.data) ? r.data : [];
      } catch (e) {
        comments.value = [];
        showToast(e.message, 'error');
      }
    }

    async function createComment() {
      if (!selectedPost.value) return;
      if (!me.value) return showToast('로그인이 필요합니다', 'error');
      if (!commentForm.content) return showToast('댓글 내용을 입력하세요', 'error');

      loading.createComment = true;
      try {
        await api(`/api/posts/${selectedPost.value.id}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content: commentForm.content })
        });
        commentForm.content = '';
        await openPost(selectedPost.value.id);
        await fetchPosts();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        loading.createComment = false;
      }
    }

    async function deleteComment(id) {
      if (!confirm('댓글을 삭제할까요?')) return;
      try {
        await api(`/api/comments/${id}`, { method: 'DELETE' });
        showToast('댓글이 삭제되었습니다');
        await openPost(selectedPost.value.id);
        await fetchPosts();
      } catch (e) {
        showToast(e.message, 'error');
      }
    }

    async function prevPage() {
      if (page.value <= 1) return;
      page.value -= 1;
      await fetchPosts();
    }

    async function nextPage() {
      page.value += 1;
      await fetchPosts();
    }

    onMounted(async () => {
      await fetchMe();
      await fetchPosts();
    });

    return {
      me, posts, comments, selectedPost,
      page, limit,
      showCreate, editingPost, showRegisterModal,
      loginForm, registerForm, createPostForm, editPostForm, commentForm,
      loading, toast,
      fmt, truncateTitle, goToLogin,
      openRegisterModal, closeRegisterModal,
      login, logout, register,
      fetchPosts, createPost,
      openPost, closePost, startEditPost, updatePost, deletePost,
      fetchComments, createComment, deleteComment,
      prevPage, nextPage,
    };
  }
}).mount('#app');
