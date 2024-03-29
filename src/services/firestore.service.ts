import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { Donation } from '../models/donation.interface';
import { PSSMessage } from '../models/pss-message.interface';

export class FirestoreService {
  private static instance: FirestoreService;
  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  private db;

  constructor() {
    const serviceAccount: ServiceAccount = {
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      projectId: process.env.FB_PROJECT_ID,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    this.db = admin.firestore();
  }

  public async addMessage(message: PSSMessage): Promise<void> {
    const batch = this.db.batch();

    // Don't care about replays
    if (message.ActivityType === 'Replay') {
      return;
    }

    // Add message to messages collection
    const document = this.db.collection('messages').doc(message.MessageId);
    batch.set(document, message);

    // If someone is donating, add a donation to the donations collection
    if (
      message.ActivityType === 'Donated' &&
      !message.Message.toLowerCase().includes('crate')
    ) {
      const crew = message.Message.split('donated')[1].trim();
      const donation: Donation = {
        owner: message.UserName,
        crew,
        expirationTime: new Date(message.MessageDate).valueOf() + 86400000,
        borrowTime: 0,
        borrower: '',
      };
      const donationDoc = this.db
        .collection('donations')
        .doc(message.MessageId);

      batch.set(donationDoc, donation);
    }
    await batch.commit().catch(err => console.error(err));

    // If someone is borrowing
    if (message.Message.includes('borrowed')) {
      // Milkey has borrowed character Assassin alien from Handsomolo
      const [borrower, rest] = message.Message.split(
        ' has borrowed character '
      );

      const [crew, owner] = rest.split(' from ');

      const donations = await this.db
        .collection('donations')
        .where('owner', '==', owner)
        .where('crew', '==', crew)
        .get();

      const donation = donations.docs.shift();
      if (donation) {
        await donation.ref.update({
          borrower,
          borrowTime: new Date().valueOf(),
        }).catch(err=> console.error(err));
      } else {
        console.log('crew not found', { borrower, crew, owner });
      }
    }

    // Remove expired donations
    const toBeDeleted = await this.db
      .collection('donations')
      .where('expirationTime', '<', new Date().valueOf())
      .get();

    try {
      await Promise.all(toBeDeleted.docs.map(doc=>doc.ref.delete()));
    } catch (error) {
      console.log('Crew already deleted',error);
    }
  }

  public async addMessages(messages: PSSMessage[]): Promise<void> {
    await Promise.all(messages.map((message) => this.addMessage(message)));
  }

  public async getDonations(): Promise<Donation[]> {
    const snapshot = await this.db.collection('donations').get();
    const donations = snapshot.docs.map((doc) => doc.data() as Donation);
    return donations;
  }
}
