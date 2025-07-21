import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';

import { getUsers, getUserByID, createUser, deleteUserById, updateUserById, getUserByEmail } from './database.js';
import { getCollections, getCollectionById } from './database.js';
import { getPostByCollectionId, getCommentByPostId, createComment, getCommentById, deleteCommentById } from './database.js';
import { getLikesForPost, createNewPost, getPostById, editPostById, deletePostByID } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(cookieParser());
app.use(session({
  secret: 'yourSecretKey', // change this in production
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true if using HTTPS
}));

app.set('view engine', 'ejs');
app.set('pages', path.join(__dirname, 'pages'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Connected on port 8080.');
});

app.get('/', async (req, res) => {
  const collections = await getCollections();
  const users = await getUsers();
  res.render('../pages/home', { users, collections });
});

app.get('/collections', isAuthenticated, async (req, res) => {
  const collections = await getCollections();
  res.render('../pages/collections', { collections });
});

app.get('/collection/:id', isAuthenticated, async (req, res) => {
  const collectionId = req.params.id;

  try {
     const collectionData = await getCollectionById(collectionId);


    if (collectionData.length === 0) {
      return res.status(404).send('Collection not found');
    }

    const collection = collectionData[0];
    const posts = await getPostByCollectionId(collectionId);

    for (const post of posts) {
      post.user = await getUserByID(post.user_id);
      post.likes = await getLikesForPost(post.id)

      const comments = await getCommentByPostId(post.id);
      for (const comment of comments) {
        comment.user = await getUserByID(comment.user_id);
      }

      post.comments = comments;
    }

    res.render('../pages/collection', { collection, posts, collectionId, session: req.session });
    }catch (err) {
      console.log(err);
      res.status(500).send('server error');
    }
});

app.post('/posts/:postId/comments', isAuthenticated, async (req, res) => {
  const post_id = req.params.postId;
  const user_id = req.session.user.id;
  const { commentDesc } = req.body;

  if (!commentDesc) {
    return res.status(400).send('Comment is required.');
  }

  try {
    await createComment(commentDesc, post_id, user_id);
    const post = await getPostById(post_id);
    res.redirect(`/collection/${post.collection_id}`);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).send('Server error');
  }
});

app.post('/comments/:commentId/delete', isAuthenticated, async (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.session.user.id;

  try {
    const comment = await getCommentById(commentId); // You may need to write this

    if (!comment || comment.user_id !== userId) {
      return res.status(403).send('Unauthorized');
    }
    const post = await getPostById(comment.post_id);
    await deleteCommentById(commentId); // You may need to write this
    res.redirect(`/collection/${post.collection_id}`);
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).send('Server error');
  }
});

app.get('/collection/:id/posts/new', isAuthenticated, async (req, res) => {
  const collectionId = req.params.id;
  res.render('../pages/createPost', { collectionId });
});

app.post('/collection/:id/posts', isAuthenticated, async (req, res) => {
  const collectionId = req.params.id;
  const userId = req.session.user.id;
  const { title, postDescription, image1 } = req.body;

  await createNewPost(title, postDescription, image1, userId, collectionId);
  res.redirect(`/collection/${collectionId}`);
});

app.get('/posts/:id/edit', isAuthenticated, async (req, res) => {
  const postId = req.params.id;

  try {
    const post = await getPostById(postId); // No destructuring

    if (!post) {
      return res.status(404).send("Post not found.");
    }

    // Only allow the owner to edit
    if (post.user_id !== req.session.user.id) {
      return res.status(403).send("Not authorized to edit this post.");
    }

    res.render('../pages/edit-post', { post });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit form');
  }
});
app.post('/posts/:id/edit', isAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const { title, postDescription, image1 } = req.body;

  try {
    const [post] = await getPostById(postId);

    // Make sure only the owner can update
    if (post.user_id !== req.session.user.id) {
      return res.status(403).send("You can't edit this post.");
    }

    await editPostById(postId, title, postDescription, image1);
    res.redirect(`/collection/${post.collection_id}`); // Or wherever the post belongs
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating post');
  }
});

app.post('/posts/:postId/delete', isAuthenticated, async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await getPostById(postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.user_id !== req.session.user.id) {
      return res.status(403).send('Unauthorized');
    }

    await deletePostByID(postId);

    // Redirect back to the collection the post belonged to
    res.redirect(`/collection/${post.collection_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/login', async (req, res) => {
  res.render('../pages/login', { error: req.query.error || null });
});

app.post('/login',async (req, res) => {
  const { email, userPassword } = req.body;

  if (!email || !userPassword) {
    return res.redirect('/login?error=Email%20and%20password%20required');
  }

  const user = await getUserByEmail(email); // Replace with your actual function
  if (!user) {
    return res.redirect('/login?error=User%20not%20found');

  }

  const match = await bcrypt.compare(userPassword, user.userPassword); // Make sure this field exists in DB
  
  if (!match) {
    return res.redirect('/login?error=Incorrect%20password');
  }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

  res.redirect('/dashboard');
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).send("Couldn't log out");
    }

    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/signup', (req, res) => {
  res.render('../pages/signup');
});

app.post('/signup', async (req, res) => {
  const { firstName, lastName, username, email, userPassword, bio, age, profilePicture } = req.body;

  if(!email || !userPassword) {
    return res.status(400).send('Email and Password required!');
  }

   try {
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userPassword, saltRounds);

    // Save to database
    const user = await createUser(firstName, lastName, username, email, hashedPassword, bio, age, profilePicture);
    const newUser = await getUserByID(id);

    req.session.user = {
      id: user.insertId,
      username: username,
      email: email,
      profilePicture: profilePicture
    };
    
    res.redirect('/dashboard');

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Error signing up user');
  }
})

app.get('/dashboard', isAuthenticated, (req, res) => {
  console.log("Logged in user:", req.session.user);
  console.log("Profile picture URL:", req.session.user.profilePicture);
  res.render('../pages/dashboard', { user: req.session.user });
});

app.get('/users/edit', isAuthenticated, async (req, res) => {
  const user = await getUserByID(req.session.user.id);
  res.render('../pages/editUser', { user });
});

app.post('/users/edit', isAuthenticated, async (req, res) => {
  const id = req.session.user.id;
  const {
    firstName, lastName, username, email,
    userPassword, bio, age, profilePicture
  } = req.body;

  let hashedPassword;
  if (userPassword && userPassword.trim() !== '') {
    hashedPassword = await bcrypt.hash(userPassword, 10);
  } else {
    const user = await getUserByID(id);
    hashedPassword = user.userPassword;
  }

  await updateUserById(id, firstName, lastName, username, email, hashedPassword, bio, age, profilePicture);
  res.redirect('/dashboard');
});

app.post('/users/delete', isAuthenticated, async (req, res) => {
  const id = req.session.user.id;

  await deleteUserById(id);

  // Destroy session
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error deleting session');
    }
    res.redirect('/signup');
  });
});