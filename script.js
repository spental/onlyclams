// ==========================================
// ONLY CLAMS - SUPABASE CONFIGURATION
// ==========================================

const SUPABASE_URL = "https://ozeqwenykukqscmhmkuz.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96ZXF3ZW55a3VrcXNjbWhta3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMjY4MjYsImV4cCI6MjEwMzYwMjgyNn0.PV5iRgfXSBMzOL3wBhYg4mI-ZgSi2JzWLxsq8iDRgMc";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==========================================
// PAGE ELEMENTS
// ==========================================

const loginButton = document.getElementById("loginButton");
const signupButton = document.getElementById("signupButton");
const logoutButton = document.getElementById("logoutButton");

const loginSection = document.getElementById("loginSection");
const accountSection = document.getElementById("accountSection");
const uploadSection = document.getElementById("uploadSection");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const uploadForm = document.getElementById("uploadForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const uploadMessage = document.getElementById("uploadMessage");

const currentUser = document.getElementById("currentUser");
const clamFeed = document.getElementById("clamFeed");


// ==========================================
// SHOW LOGIN
// ==========================================

loginButton.addEventListener("click", () => {

    loginSection.classList.remove("hidden");

    accountSection.classList.add("hidden");

});


// ==========================================
// SHOW SIGNUP
// ==========================================

signupButton.addEventListener("click", () => {

    accountSection.classList.remove("hidden");

    loginSection.classList.add("hidden");

});


// ==========================================
// CREATE ACCOUNT
// ==========================================

signupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const username =
        document.getElementById("signupUsername").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;


    signupMessage.textContent = "Creating account...";


    try {

       const { data, error } =
    await supabaseClient.auth.signUp({
        email: email,
        password: password,

        options: {
            data: {
                username: username
            }
        }
    });


        if (error) {
            throw error;
        }


        if (!data.user) {
            throw new Error("Unable to create account.");
        }


        // Save username in profiles table

        const { error: profileError } =
            await supabaseClient
                .from("profiles")
                .insert({
                    id: data.user.id,
                    username: username
                });


        if (profileError) {
            throw profileError;
        }


        signupMessage.textContent =
            "Account created! Check your email to confirm your account.";

        signupForm.reset();

    }

    catch (error) {

        console.error(error);

        signupMessage.textContent =
            "Error: " + error.message;

    }

});


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email =
        document.getElementById("loginEmail").value;

    const password =
        document.getElementById("loginPassword").value;


    loginMessage.textContent = "Logging in...";


    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });


    if (error) {

        loginMessage.textContent =
            "Error: " + error.message;

        return;
    }


    loginMessage.textContent =
        "Successfully logged in!";

    loginForm.reset();

    loginSection.classList.add("hidden");

    await updateUserInterface();

});


// ==========================================
// LOG OUT
// ==========================================

logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    await updateUserInterface();

});


// ==========================================
// UPLOAD CLAM
// ==========================================

uploadForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    uploadMessage.textContent =
        "Uploading your clam...";


    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    if (!user) {

        uploadMessage.textContent =
            "You must be logged in.";

        return;
    }


    const photoInput =
        document.getElementById("clamPhoto");

    const caption =
        document.getElementById("clamCaption").value.trim();


    const file =
        photoInput.files[0];


    if (!file) {

        uploadMessage.textContent =
            "Please select a photo.";

        return;
    }


    // Create unique filename

    const fileExtension =
        file.name.split(".").pop();

    const fileName =
        `${user.id}/${Date.now()}.${fileExtension}`;


    // Upload image

    const { error: uploadError } =
        await supabaseClient
            .storage
            .from("clam-photos")
            .upload(fileName, file);


    if (uploadError) {

        console.error(uploadError);

        uploadMessage.textContent =
            "Photo upload failed: " +
            uploadError.message;

        return;
    }


    // Get public URL

    const { data: imageData } =
        supabaseClient
            .storage
            .from("clam-photos")
            .getPublicUrl(fileName);


    const imageUrl =
        imageData.publicUrl;


    // Get username

    const { data: profile } =
        await supabaseClient
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();


    if (!profile) {

        uploadMessage.textContent =
            "Could not find your username.";

        return;
    }


    // Save post

   const { error: postError } =
    await supabaseClient
        .from("clams")
        .insert({

            user_id: user.id,

            username: profile.username,

            image_url: imageUrl,

            caption: caption

        });


if (postError) {

    console.error("POST ERROR:", postError);

    uploadMessage.textContent =
        "Could not create your post: " + postError.message;

    return;
}


    uploadMessage.textContent =
        "🦪 Your clam has been posted!";


    uploadForm.reset();


    // Refresh feed

    await loadClams();

});


// ==========================================
// LOAD CLAMS
// ==========================================

async function loadClams() {

    clamFeed.innerHTML =
        "<p class='loading'>Loading clams...</p>";


    const { data, error } =
        await supabaseClient
            .from("clams")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        clamFeed.innerHTML =
            "<p>Unable to load clams.</p>";

        return;
    }


    clamFeed.innerHTML = "";


    if (!data || data.length === 0) {

        clamFeed.innerHTML =
            "<p>No clams have been posted yet. Be the first!</p>";

        return;
    }


    data.forEach((clam) => {


        const post =
            document.createElement("article");

        post.className =
            "clam-post";


        const image =
            document.createElement("img");

        image.src =
            clam.image_url;

        image.alt =
            "Clam posted by " + clam.username;


        const info =
            document.createElement("div");

        info.className =
            "clam-info";


        const username =
            document.createElement("div");

        username.className =
            "clam-username";

        username.textContent =
            "🦪 @" + clam.username;


        const caption =
            document.createElement("div");

        caption.className =
            "clam-caption";

        caption.textContent =
            clam.caption || "";


        info.appendChild(username);

        info.appendChild(caption);

        post.appendChild(image);

        post.appendChild(info);

        clamFeed.appendChild(post);

    });

}


// ==========================================
// UPDATE INTERFACE
// ==========================================

async function updateUserInterface() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();


    if (user) {

        loginButton.classList.add("hidden");

        signupButton.classList.add("hidden");

        logoutButton.classList.remove("hidden");

        uploadSection.classList.remove("hidden");


        const { data: profile } =
            await supabaseClient
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .single();


        if (profile) {

            currentUser.textContent =
                "Logged in as @" + profile.username;

        }

    }

    else {

        loginButton.classList.remove("hidden");

        signupButton.classList.remove("hidden");

        logoutButton.classList.add("hidden");

        uploadSection.classList.add("hidden");

        currentUser.textContent = "";

    }

}


// ==========================================
// CHECK LOGIN WHEN PAGE LOADS
// ==========================================

async function initialize() {

    await updateUserInterface();

    await loadClams();

}


// Start website

initialize();
