import { useRef, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Grid3X3,
  Bookmark,
  Repeat2,
  ContactRound,
  Plus,
  MoreHorizontal,
  X,
  ImagePlus,
} from "lucide-react";
import "./Home.css";

const initialPosts = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600",
  "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=600",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600",
];

const defaultProfile = {
  username: "manishapaul1009",
  name: "Manisha Paul",
  bio: "here is my bio",
  image:
    "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop",
};

function Home() {
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const [profile, setProfile] = useState(defaultProfile);
  const [form, setForm] = useState(defaultProfile);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEditProfile = () => {
    setForm({ ...profile });
    setSelectedPhoto(null);
    setPhotoError("");
    setShowEdit(true);
  };

  const closeEditProfile = () => {
    setShowEdit(false);
    setSelectedPhoto(null);
    setPhotoError("");
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedPhoto(reader.result);
        setForm((previous) => ({
          ...previous,
          image: reader.result as string,
        }));
      }
    };

    reader.onerror = () => {
      setPhotoError("Could not read this image. Please try another.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setProfile({ ...form });
    setShowEdit(false);
    setSelectedPhoto(null);
    setPhotoError("");
  };

  const tabs = [
    { id: "posts", label: "Posts", Icon: Grid3X3 },
    { id: "saved", label: "Saved", Icon: Bookmark },
    { id: "reposts", label: "Reposts", Icon: Repeat2 },
    { id: "tagged", label: "Tagged", Icon: ContactRound },
  ];

  return (
    <main className="instagram-profile">
      <div className="profile-wrapper">
        {/* Profile header */}
        <section className="profile-header">
          <div className="profile-avatar-column">
            <div className="profile-avatar">
              <img src={profile.image} alt={`${profile.username}'s profile`} />
            </div>
          </div>

          <div className="profile-information">
            <div className="username-row">
              <h1>{profile.username}</h1>

              <BadgeCheck
                size={18}
                className="verified-icon"
                aria-label="Verified"
              />

              <button
                type="button"
                className="icon-button"
                aria-label="More profile options"
              >
                <MoreHorizontal size={23} />
              </button>
            </div>

            <p className="profile-real-name">{profile.name}</p>

            <div className="profile-statistics">
              <div>
                <strong>29</strong> posts
              </div>
              <div>
                <strong>107</strong> followers
              </div>
              <div>
                <strong>163</strong> following
              </div>
            </div>

            <p className="profile-birthday">{profile.bio}</p>
          </div>
        </section>

        {/* Own profile actions */}
        <div className="profile-buttons">
          <button
            type="button"
            className="profile-edit-button"
            onClick={openEditProfile}
          >
            Edit profile
          </button>

          <button
            type="button"
            className="profile-archive-button"
            onClick={() => setShowArchive(true)}
          >
            View archive
          </button>
        </div>

        {/* Story highlight */}
        <section className="profile-highlights">
          <button
            type="button"
            className="story-highlight"
            onClick={() =>
              alert("Story creation can be connected to your backend next.")
            }
            aria-label="Add new story highlight"
          >
            <div className="story-circle">
              <Plus size={38} strokeWidth={1.2} />
            </div>
            <span>New</span>
          </button>
        </section>

        {/* Profile tabs */}
        <nav className="profile-navigation" aria-label="Profile tabs">
          {tabs.map(({ id, label, Icon }) => (
            <button
              type="button"
              key={id}
              className={`profile-tab ${activeTab === id ? "selected" : ""}`}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              title={label}
            >
              <Icon size={20} strokeWidth={1.8} />
            </button>
          ))}
        </nav>

        {/* Posts gallery */}
        {activeTab === "posts" ? (
          <section className="profile-gallery" aria-label="Posts gallery">
            {initialPosts.map((image, index) => (
              <button
                type="button"
                className="gallery-item"
                key={image}
                onClick={() =>
                  alert(
                    `Post ${index + 1} selected. Post details can be added next.`,
                  )
                }
                aria-label={`Open post ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`Profile post ${index + 1}`}
                  loading="lazy"
                />
              </button>
            ))}
          </section>
        ) : (
          <section className="profile-empty-state">
            {activeTab === "saved" && <Bookmark size={32} />}
            {activeTab === "reposts" && <Repeat2 size={32} />}
            {activeTab === "tagged" && <ContactRound size={32} />}

            <h2>
              {activeTab === "saved"
                ? "Saved"
                : activeTab === "reposts"
                  ? "Reposts"
                  : "Photos of you"}
            </h2>

            <p>
              {activeTab === "saved"
                ? "Posts you save will appear here."
                : activeTab === "reposts"
                  ? "Posts you repost will appear here."
                  : "Photos you're tagged in will appear here."}
            </p>
          </section>
        )}
      </div>

      {/* Edit profile modal */}
      {showEdit && (
        <div className="profile-modal-backdrop" onClick={closeEditProfile}>
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-heading">
              <h2 id="edit-profile-heading">Edit profile</h2>

              <button
                type="button"
                className="modal-close"
                onClick={closeEditProfile}
                aria-label="Close edit profile"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveProfile}>
              {/* Profile photo preview and upload */}
              <div className="change-photo-section">
                <img
                  className="change-photo-preview"
                  src={selectedPhoto || form.image}
                  alt="Profile photo preview"
                />

                <div className="change-photo-actions">
                  <strong>{form.username || "Your profile"}</strong>

                  <button
                    type="button"
                    className="change-photo-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus size={16} />
                    Change photo
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoChange}
                  />

                  <span className="photo-help">
                    JPG, PNG or other image formats · Max 5 MB
                  </span>
                </div>
              </div>

              {photoError && (
                <p className="photo-error" role="alert">
                  {photoError}
                </p>
              )}

              <label htmlFor="edit-username">Username</label>
              <input
                id="edit-username"
                type="text"
                required
                maxLength={30}
                value={form.username}
                onChange={(event) =>
                  setForm({
                    ...form,
                    username: event.target.value,
                  })
                }
              />

              <label htmlFor="edit-name">Name</label>
              <input
                id="edit-name"
                type="text"
                required
                maxLength={60}
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />

              <label htmlFor="edit-bio">Bio</label>
              <textarea
                id="edit-bio"
                rows={3}
                maxLength={150}
                value={form.bio}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bio: event.target.value,
                  })
                }
              />

              <label className="photo-url-label" htmlFor="edit-image">
                Or enter a profile photo URL
              </label>
              <input
                id="edit-image"
                type="url"
                value={selectedPhoto ? "" : form.image}
                placeholder="https://example.com/photo.jpg"
                onChange={(event) => {
                  setSelectedPhoto(null);
                  setForm({
                    ...form,
                    image: event.target.value,
                  });
                }}
              />

              <button className="save-profile-button" type="submit">
                Save changes
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Archive modal */}
      {showArchive && (
        <div
          className="profile-modal-backdrop"
          onClick={() => setShowArchive(false)}
        >
          <section
            className="profile-modal archive-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-heading">
              <h2 id="archive-heading">Archive</h2>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowArchive(false)}
                aria-label="Close archive"
              >
                <X size={22} />
              </button>
            </div>

            <p>Your archived posts and stories will appear here.</p>
          </section>
        </div>
      )}
    </main>
  );
}

export default Home;
