# 📸 Photo Swiper

![Photo Swiper Interface](https://via.placeholder.com/1200x600?text=Photo+Swiper+-+Tinder+for+Your+Photos)

**A lightning-fast, Tinder-style photo culling app built for rapid photo curation.**

---

## 📖 The Story: Why I Built This

It started with a common problem: My mom loves taking photos. Thousands of them. After a recent family event, she came back with over 2,600 photos and videos. 

**The Problem:**
Going through thousands of high-resolution photos using standard gallery apps or file explorers is a miserable, stressful experience. 
1. **It's slow**: Loading massive files one by one takes forever.
2. **It's tedious**: The process of "Right Click > Copy > Navigate to another folder > Paste" for hundreds of "keeper" photos is mind-numbing.
3. **It's frustrating**: If she accidentally closed the window, she lost her place and had to start from the beginning.
4. **It's exhausting**: Dragging and dropping over 2,000 times destroys your wrist and ruins the joy of photography.

She would stop in the middle from sheer stress, and trying to pick up where she left off was impossible.

**The Solution:**
I decided to over-engineer a solution. I built **Photo Swiper**—a web application designed specifically to make sorting thousands of photos incredibly fast, dead simple, and actually fun.

I took the UI mechanics of "Swiping" from dating apps and applied it to photo galleries:
- **Swipe UP (or Arrow Up) = Keep the photo.** It instantly copies the photo to your "Keepers" folder.
- **Swipe DOWN (or Arrow Down) = Skip the photo.**
- **Carousel Browsing:** Use Left/Right arrows to look around without making a decision.
- **Auto-Save:** It remembers your exact spot. Close the app, come back tomorrow, and pick up right where you left off. 
- **Aggressive Pre-loading:** It fetches the next 15 photos in the background so there are **zero loading times** and **zero black screens**. 

What used to take days of stressful clicking now takes minutes of easy swiping.

---

## ✨ Features

- **Tinder-Style Swiping:** Drag cards up to KEEP, down to SKIP.
- **Lightning Fast:** Aggressive memory preloading ensures images appear instantly, even across thousands of files.
- **Duplicate Protection:** Safely stops you from copying the same file twice.
- **Progress Bookmarking:** Automatically saves your "Focus Photo" index. Refresh the page or restart the app, and you're exactly where you were.
- **Jump to Photo:** Click the photo number to instantly jump to any photo (e.g., skip straight to photo 1060).
- **Undo History:** Made a mistake? Press `Cmd+Z` (or click Undo) to retrieve a skipped photo or un-copy a kept photo.
- **Native Folder Pickers:** Securely choose source and target directories using your OS's native file dialogs.
- **Multi-Media Support:** Supports standard images (JPG, PNG, WEBP), Apple formats (HEIC), and videos (MP4, MOV).
- **Responsive UI:** A gorgeous, glassmorphic dark-mode design that works on mouse, trackpad, screens, and tablets.

---

## 🚀 Dead-Easy Setup (1-Click Run)

You don't need to be a programmer to run this. It works on both Windows and Mac.

### Prerequisites
You must have [Node.js](https://nodejs.org/) installed on your computer.

### For Windows Users
1. Download or clone this repository.
2. Double-click the **`setup-windows.bat`** file.
3. The script will automatically install everything and open the app in your browser!

### For Mac / Linux Users
1. Download or clone this repository.
2. Open your terminal in the folder and run:
   ```bash
   bash setup-mac-linux.sh
   ```
3. The script will install everything and start the app!

---

## 🛠️ Manual Installation (For Devs)

If you prefer to run it manually:

```bash
# 1. Clone the repo
git clone https://github.com/dataanalystram/Photoswiper.git

# 2. Navigate to directory
cd Photoswiper

# 3. Install dependencies
npm install

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing & Contact

This project is fully open-source. Whether you're a photographer struggling with culling, or a developer wanting to add new features (like EXIF data reading or cloud sync), your contributions are welcome!

**Have ideas, questions, or just want to chat?**
Message me on [LinkedIn](https://www.linkedin.com/in/dataanalystram) and let's connect!
