import { createRouter, createWebHistory } from "vue-router";
// import { computed } from "vue";
// import { auth, onAuthStateChanged } from "@/firebase/firebase.js";
// import { useAuthStore } from "@/stores/auth-store.js";
// import { storeToRefs } from "pinia";
import HomeView from "../views/HomeView.vue";
// import marketListView from "../views/market-list.vue";
// eslint-disable-next-line
// import { reject } from 'core-js/fn/promise';

const routes = [
  {
    path: "/:pathMatch(.*)*",
    name: "404",
    component: () => import("@/views/not-found.vue"),
    // meta: { requiresAuth: false },
  },
  {
    path: "/",
    name: "Home",
    component: HomeView,
    // meta: { requiresAuth: false },
  },
  {
    path: "/about",
    name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
    // meta: { requiresAuth: false },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/login-page.vue"),
    meta: { requiresAuth: false },
    // async beforeEnter(to, from, next) {
    //   // let user =  auth.currentUser;
    //   if (await getCurrentUser()) {
    //     // User is authenticated.
    //     // You can redirect the user to a different route.
    //     next("/");
    //   } else {
    //     console.log("before route else");
    //     // User is not authenticated.
    //     // Allow the user to access the login route.
    //     next();
    //   }
    // },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/register-page.vue"),
    // meta: { requiresAuth: false },
  },
  {
    path: "/market-list",
    name: "MarketList",
    component: () => import("../views/market-list.vue"),
    // component: marketListView,
    meta: { requiresAuth: true },
    // async beforeEnter(to, from, next) {
    //   // console.log(await useAuthStore.userData.uid);
    //   // const hasToken = await useAuthStore.userData.uid;
    //   // console.log(hasToken);
    //   next((await getCurrentUser) ? "Market-list" : "/");
    // },
  },
  // {
  //   path:"/market-list-home",
  //   name:"marketListHome",
  //   component: () => import('../views/market-list-home.vue'),
  //   }
];

// const getCurrentUser = () => {
//   return new Promise((resolve, reject) => {
//     const removeListener = onAuthStateChanged(
//       auth,
//       (user) => {
//         console.log("user u ROUTERs", user);
//         removeListener();
//         resolve(user);
//       },
//       reject
//     );
//   });
// };

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
// router.beforeEach(async (to, from, next) => {
//   // const user = useUser();
//   const authStore = useAuthStore();
//   // await user.get();
//   await authStore.isLoggedIn;

//   console.log("authStore.isLoggedIn sada", authStore.isLoggedIn); // user is defined

//   if (to.meta.requiresAuth && !authStore.isLoggedIn) {
//     // next({ name: "Home" });
//     // next(false);
//     next(from);
//     return;
//   } // this will work
//   // else if (!to.meta.requiresAuth) {
//   next();
//   return;
//   // }
//   // next();
// });
// router.beforeEach(async (to, from, next) => {
//   const authStore = await useAuthStore();
//   const { userData } = await storeToRefs(authStore);
//   const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
//   const isAuthenticated = userData.isLoggedIn;
//   console.log("userData", userData.isLoggedIn);
//   if (requiresAuth & !isAuthenticated) {
//     next("/");
//     console.log("userData /", userData.isLoggedIn);
//   } else {
//     next();
//   }
// });
//   if (to.matched.some((record) => record.meta.requiresAuth)) {
//     // This route requires authentication.
//     // Check if the user is authenticated.
//     // const isLoggedIn = computed(() => {
//     // return authStore.userData.isLoggedIn;
//     //   console.log("console in isLoggedIn", !isLoggedIn.value);
//     //   return authStore.isLoggedIn;
//     // });
//     if (userData.isLoggedIn === false) {
//       console.log("!authStore.isLoggedIn22", !authStore.userData.isLoggedIn);
//       // The user is not authenticated. Redirect to the login page.
//       next({
//         path: "/login",
//         // query: { redirect: to.fullPath },
//       });
//     } else {
//       console.log("authStore.isLoggedIn", authStore.userData.isLoggedIn);
//       // The user is authenticated. Allow the route change to proceed.
//       next();
//     }
//   } else {
//     // This route does not require authentication. Allow the route change to proceed.
//     next();
//   }
// });

// router.beforeEach((to, from) => {
//   // instead of having to check every route record with
//   // to.matched.some(record => record.meta.requiresAuth)
//   if (to.meta.requiresAuth && useAuthStore.isLoggedIn == false) {
//     // this route requires auth, check if logged in
//     // if not, redirect to login page.
//     return {
//       path: "/login",
//       // save the location we were at to come back later
//       // query: { redirect: to.fullPath },
//     };
//   }
// });
// router.beforeEach(async (to, from, next) => {
//   const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
//   console.log(requiresAuth);
//   const isAuthenticated = await getCurrentUser;

//   console.log("isAuthenticated", isAuthenticated);
//   //da bi se koristio VUEX mora da se i importuje na pocetku
//   // const isAuthenticated = store.state.IsLoggedIn;

//   if (requiresAuth & !isAuthenticated) {
//     // store.dispatch("Snackbar_Message", {
//     //     boolean: true,
//     //     message: "Potrebno je da se logujete kako bi ste pristupili ovoj stranici",
//     //     color: "error"
//     // }, 500)

//     next("/");
//   } else {
//     next();
//   }
// });
// router.beforeEach(async (to, from, next) => {
//   console.log(getCurrentUser);
//   if (to.meta.requiresAuth && (await getCurrentUser)) {
// console.log(useAuthStore.userData);
// let userLogged = useAuthStore.userData;
// if (getCurrentUser) {
//   console.log("prvi");
//   next();
// } else {
//   alert("You must be logged in to see this page");
//   next({
//     path: "/",
//   });
// }
// next();
// } else {
// next("/");
// alert("moras da se login");
// }
// });
// router.beforeEach((to, from, next) => {
//   onAuthStateChanged(auth,(user) => {
//     if (user) {
//       // User is authenticated.
//       // Allow the user to access the route.
//       next();
//     } else {
//       // User is not authenticated.
//       // You can redirect the user to the login page, for example.
//       next({ path: '/login' });
//     }
//   });
// });
// router.beforeEach(async(to, from) => {
//   onAuthStateChanged(auth,(user) => {
//     if (
//       // make sure the user is authenticated
//       !isAuthenticated &&
//       // ❗️ Avoid an infinite redirect
//       to.name !== 'Login'
//     ) {
//       // redirect the user to the login page
//       return { name: 'Login' }
//     }
//   })
//   });
// });
// router.beforeEach((to, from, next) => {
//   const user = auth.currentUser
//   // onAuthStateChanged(auth,(user) => {
//     if (user && to.path == '/login') {
//       console.log('if',user)
//       console.log('==login')
//       // User is logged in, allow access to route
//       next({ path: '/' });
//       // return { name: 'Login' }
//     }
//     else {
//       // User is not logged in, redirect to login page
//       console.log('else',user)
//       console.log('!=login')
//       next()
//     }
//   })
// })
export default router;
