/**
 * @name LastSeen
 * @version 1.0.0
 * @description Tracks the last time a specific user was seen online and saves the last seen in their notes.
 * @author PROPHECY
 */

module.exports = class UserTimeTracker {
    constructor() {
        this.userId = "337442639626633216"; // Replace with the target user's ID
        this.interval = null;
        this.lastSeen = null; // Store the last seen date and time
        this.wasOnline = false; // Track if the user was previously online
    }

    start() {
        // Check if required Discord modules are available
        const userModule = BdApi.findModuleByProps("getUser");
        const statusModule = BdApi.findModuleByProps("getStatus");

        if (!userModule || !statusModule) {
            BdApi.showToast("Required modules not found. Update BetterDiscord!", { type: "error" });
            return;
        }

        this.userModule = userModule;
        this.statusModule = statusModule;

        // Start monitoring the user's status
        this.monitorUser();
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    monitorUser() {
        this.interval = setInterval(() => {
            try {
                const user = this.userModule.getUser(this.userId);
                const status = this.statusModule.getStatus(this.userId);

                if (!user) {
                    console.error(`User with ID ${this.userId} not found.`);
                    return;
                }

                if (status === "online") {
                    // Mark that the user is currently online
                    this.wasOnline = true;
                } else if (this.wasOnline && status !== "online") {
                    // If the user was online and is now offline, update "Last Seen"
                    this.wasOnline = false;

                    const now = new Date();
                    const formattedDateTime = this.formatDateTime(now);

                    if (this.lastSeen !== formattedDateTime) {
                        this.lastSeen = formattedDateTime;
                        this.saveLastSeen(user.username, this.lastSeen);
                    }
                }
            } catch (error) {
                console.error("Error in LastSeen:", error);
            }
        }, 60000); // Check every minute
    }

    formatDateTime(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    saveLastSeen(username, lastSeenDateTime) {
        const notes = BdApi.findModuleByProps("updateNote");

        if (notes && username && lastSeenDateTime) {
            try {
                const userNote = `Last seen: ${lastSeenDateTime}`;
                notes.updateNote(this.userId, userNote); // Save as a note for the user
            } catch (error) {
                console.error("Error saving Last Seen note:", error);
            }
        } else {
            console.error("Unable to save notes for the user. Modules missing.");
        }
    }
};
