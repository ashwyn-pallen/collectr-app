import mysql from 'mysql2';

import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
host: process.env.MYSQL_HOST,
user: process.env.MYSQL_USER,
password: process.env.MYSQL_PASSWORD,
database: process.env.MYSQL_DATABASE
}) .promise();

/////////////////////////users///////////////////////////////////

// GET ALL USER INFORMATION
export async function getUsers() {
const [userRows] = await pool.query("SELECT * FROM users");
return userRows;
};

// GET ONE USERS INFORMATION BY ID
export async function getUserByID(id) {
    const [userRow] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return userRow [0];
};

//GET USER BY EMAIL
export async function getUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

// CREATE A USER
export async function createUser(firstName, LastName, username, email, userPassword, bio, age, profilePicture) {
    const [result] = await pool.query(`
        INSERT INTO users
        (firstname, lastname, username, email, userpassword, bio, age, profilepicture)
        VALUES
        (?,?,?,?,?,?,?,?)    
        `, [firstName, LastName, username, email, userPassword, bio, age, profilePicture]);
    
        return result.insertId;
};

//DELETE USER BY ID
export async function deleteUserById(id) {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows;
};

//UPDATE USER INFORMATION BY USER ID

export async function updateUserById(id, firstName, lastName, username, email, userPassword, bio, age, profilePicture) {
  const [result] = await pool.query(
    `UPDATE users 
     SET firstname = ?, lastname = ?, username = ?, email = ?, userpassword = ?, bio = ?, age = ?, profilepicture = ? 
     WHERE id = ?`,
    [firstName, lastName, username, email, userPassword, bio, age, profilePicture, id]
  );
  return result.affectedRows;
};

/////////////////////////posts///////////////////////////////////

//GET ALL POSTS

export async function getAllPosts(){
  const [postRows] = await pool.query("SELECT * FROM posts");
  return postRows;
}

//GET POST BY ID

export async function getPostById(id) {
  const [postRow] = await pool.query("SELECT * FROM posts WHERE id = ?", [id]);
  return postRow[0];
}


//GET POST BY USERS ID

export async function getPostByUsersId(id){
  const [result] = await pool.query("SELECT * FROM Posts WHERE user_id = ?;", [id]);
  return result;
}

//GET POST BY COLLECTION ID

export async function getPostByCollectionId(id){
  const [result] = await pool.query("SELECT * FROM Posts WHERE collection_id = ?;", [id]);
  return result;
}

//CREATE NEW POSTS

export async function createNewPost(title, postDescription, image1, user_id, collection_id){
      const [result] = await pool.query(`
        INSERT INTO posts
        (title, postDescription, image1, user_id, collection_id)
        VALUES
        (?,?,?,?,?)    
        `, [title, postDescription, image1, user_id, collection_id]);
    return result.insertId
}


//EDIT POSTS BY ID

export async function editPostById(id, title, postDescription, image1) {
  const [result] = await pool.query(
    `UPDATE posts 
     SET title = ?, postDescription = ?, image1 = ? 
     WHERE id = ?`,
    [title, postDescription, image1, id]
  );
  return result.affectedRows;
};

//DELETE POSTS BY ID

export async function deletePostByID(id) {
    const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [id]);
    return result.affectedRows;
};

/////////////////////////collections///////////////////////////////////

//VIEW COLLECTIONS

export async function getCollections() {
  const [collection] = await pool.query("SELECT * FROM collection");
  return collection;
}

//VIEW COLLECTIONS BY ID

export async function getCollectionById(id){
  const [collection] = await pool.query("SELECT * FROM collection WHERE id = ?", [id]);
  return collection;
}

/////////////////////////comments///////////////////////////////////

export async function getCommentByPostId(id){
  const [comment] = await pool.query("SELECT * FROM comments WHERE post_id = ?", [id]);
  return comment;
}

export async function getCommentByUserId(id){
  const [comment] = await pool.query("SELECT * FROM comments WHERE user_id = ?", [id]);
  return comment;
}

export async function getCommentById(id) {
  const [rows] = await pool.query("SELECT * FROM comments WHERE id = ?", [id]);
  return rows[0];
}

export async function createComment(commentDesc, post_id, user_id){
  const [comment] = await pool.query(`
    INSERT INTO comments
    (commentDesc, post_id, user_id)
    VALUES
    (?,?,?)
    `, [commentDesc, post_id, user_id]);
    return comment.insertId;
}


export async function editCommentById(id, commentDesc, post_id, user_id) {
  const [comment] = await pool.query(
    `UPDATE comments 
     SET commentDesc = ?, post_id = ?, user_id = ? 
     WHERE id = ?`,
    [commentDesc, post_id, user_id, id]
  );
  return comment.affectedRows;
};

export async function deleteCommentById(id) {
  const [comment] = await pool.query("DELETE FROM comments WHERE id = ?", [id]);
  return comment.affectedRows;
};


/////////////////////////likes///////////////////////////////////

export async function getLikes() {
  const [likes] = await pool.query("SELECT * FROM likes");
  return likes;
}

export async function getLikesForPost(postId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS totalLikes FROM likes WHERE likePostId = ?`,
    [postId]
  );
  return rows[0].totalLikes || 0;
}

export async function addLikes(likeUserId, likePostId){
  const [likes] = await pool.query(`
    INSERT INTO likes
    (likeUserId, likePostId)
    VALUES
    (?,?)
    `, [likeUserId, likePostId]);
    return comment.insertId;
}

export async function updatelikesById(likeUserId, likePostId) {
  const [comment] = await pool.query(
    `UPDATE likes 
     SET likeUserId = ?, likePostId = ? 
     WHERE id = ?`,
    [likeUserId, likePostId, id]
  );
  return comment.affectedRows;
};

export async function deletelikesById(id) {
  const [comment] = await pool.query("DELETE FROM likes WHERE id = ?", [id]);
  return comment.affectedRows;
};

///////////////////Relationships///////////////////////////////

 export async function getFollows() {
  const [follow] = await pool.query("SELECT * FROM relationships");
  return follow;
}

export async function getfollowsByfollowerId(followerUserid){
  const [follow] = await pool.query("SELECT * FROM relationships WHERE followerUserId = ?", [followerUserid]);
  return follow;
}

export async function updatefollowersByFollowerID(followerUserId, followedUserId) {
  const [follow] = await pool.query(
    `UPDATE relationships 
     SET followerUserId = ?, followedUserId = ? 
     WHERE followerUserId = ?`,
    [followerUserId, followedUserId, followedUserId]
  );
  return follow.affectedRows;
};

