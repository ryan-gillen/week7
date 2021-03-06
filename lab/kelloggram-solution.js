let db = firebase.firestore()
// Change main event listener from DOMContentLoaded to
// firebase.auth().onAuthStateChanged and move code that
// shows login UI to only show when signed out
firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    // Signed in
    console.log('signed in')
    // Ensure the signed-in user is in the users collection
    db.collection('users').doc(user.uid).set({
      name: user.displayName,
      email: user.email
    })
    // Sign-out button
    document.querySelector('.sign-in-or-sign-out').innerHTML = `
      <button class="text-pink-500 underline sign-out">Sign Out</button>
    `
    document.querySelector('.sign-out').addEventListener('click', function(event) {
      console.log('sign out clicked')
      firebase.auth().signOut()
      document.location.href = 'kelloggram.html'
    })
    // Listen for the form submit and create/render the new post
    document.querySelector('form').addEventListener('submit', async function(event) {
      event.preventDefault()
      let postUsername = user.displayName
      let postImageUrl = document.querySelector('#image-url').value
      let postNumberOfLikes = 0
      let docRef = await db.collection('posts').add({
        username: postUsername,
        imageUrl: postImageUrl,
        created: firebase.firestore.FieldValue.serverTimestamp()
      })
      // clear input form
      let postId = docRef.id // the newly created document's ID
      renderPost(postId, postUsername, postImageUrl, postNumberOfLikes)
    })
    // Render all posts when the page is loaded
    let querySnapshot = await db.collection('posts').orderBy('created').get()
    let posts = querySnapshot.docs
    for (let i=0; i<posts.length; i++) {
      let postId = posts[i].id
      let postData = posts[i].data()
      let postUsername = postData.username
      let postImageUrl = postData.imageUrl
      let querySnapshot = await db.collection('likes')
                                  .where('postId', '==', postId)
                                  .get()
      let postNumberOfLikes = querySnapshot.size
      renderPost(postId, postUsername, postImageUrl, postNumberOfLikes)
    }
  } else {
    // Signed out
    console.log('signed out')
    // Hide the form when signed-out
    document.querySelector('form').classList.add('hidden')
    // Initializes FirebaseUI Auth
    let ui = new firebaseui.auth.AuthUI(firebase.auth())
    // FirebaseUI configuration
    let authUIConfig = {
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      signInSuccessUrl: 'kelloggram.html'
    }
    // Starts FirebaseUI Auth
    ui.start('.sign-in-or-sign-out', authUIConfig)
  }
})
async function renderPost(postId, postUsername, postImageUrl, postNumberOfLikes) {
  document.querySelector('.posts').insertAdjacentHTML('beforeend', `
    <div class="post-${postId} md:mt-16 mt-8 space-y-8">
      <div class="md:mx-0 mx-4">
        <span class="font-bold text-xl">${postUsername}</span>
      </div>
      <div>
        <img src="${postImageUrl}" class="w-full">
      </div>
      <div class="text-3xl md:mx-0 mx-4">
        <button class="like-button">❤️</button>
        <span class="likes">${postNumberOfLikes}</span>
      </div>
    </div>
  `)
  document.querySelector(`.post-${postId} .like-button`).addEventListener('click', async function(event) {
    event.preventDefault()
    console.log(`post ${postId} like button clicked!`)
    let currentUser = firebase.auth().currentUser
    // step 4:
    let querySnapshot = await db.collection('likes')
                                .where('postId', '==', postId)
                                .where('userId', '==', currentUser.uid)
                                .get()
    if (querySnapshot.size == 0) {
      // step 3:
      await db.collection('likes').add({
        postId: postId,
        userId: currentUser.uid
      })
      let existingNumberOfLikes = document.querySelector(`.post-${postId} .likes`).innerHTML
      let newNumberOfLikes = parseInt(existingNumberOfLikes) + 1
      document.querySelector(`.post-${postId} .likes`).innerHTML = newNumberOfLikes
    }
    // await db.collection('posts').doc(postId).update({
    //   likes: firebase.firestore.FieldValue.increment(1)
    // })
  })
}
