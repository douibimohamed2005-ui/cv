-- 1️⃣ حذف الجداول القديمة تماماً لتجنب التضارب
DROP TABLE IF EXISTS reviews;

DROP TABLE IF EXISTS cvs;

DROP TABLE IF EXISTS profiles;

DROP TABLE IF EXISTS auth_users;

-- 2️⃣ إعادة إنشاء جدول المستخدمين بحيث يقبل الـ UUID النصي الطويل
CREATE TABLE auth_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'local',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3️⃣ إعادة إنشاء جدول البروفايلات برابط نصي
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    role VARCHAR(100) DEFAULT 'user',
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_users (id) ON DELETE CASCADE
);

-- 4️⃣ إعادة إنشاء جدول السير الذاتية برابط نصي
CREATE TABLE cvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    template VARCHAR(100) DEFAULT 'default',
    data JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_users (id) ON DELETE CASCADE
);

-- 5️⃣ الفهارس
CREATE INDEX idx_profiles_user ON profiles (user_id);

CREATE INDEX idx_cvs_user ON cvs (user_id);

CREATE INDEX idx_cvs_updated ON cvs (updated_at DESC);

-- 6️⃣ جدول التقييمات برابط نصي
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    review_text TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_users (id) ON DELETE CASCADE
);