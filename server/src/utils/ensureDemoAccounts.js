import { User, Hotel } from '../models/index.js';

export const ensureDemoAccounts = async () => {
  try {
    const demoAccounts = [
      {
        name: 'Vikramaditya Singhania',
        email: 'admin@shreehotels.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 98201 12345',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        isEmailVerified: true,
      },
      {
        name: 'Vikramaditya Singhania',
        email: 'admin@hotelpro.com',
        password: 'Admin@123',
        role: 'admin',
        phone: '+91 98201 12345',
        isEmailVerified: true,
      },
      {
        name: 'Ananya Sharma',
        email: 'guest@shreehotels.com',
        password: 'Guest@123',
        role: 'guest',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        isEmailVerified: true,
      },
      {
        name: 'Ananya Sharma',
        email: 'guest@hotelpro.com',
        password: 'Guest@123',
        role: 'guest',
        phone: '+91 98765 43210',
        isEmailVerified: true,
      },
    ];

    for (const data of demoAccounts) {
      let user = await User.findOne({ email: data.email });
      if (!user) {
        await User.create(data);
        console.log(`[Demo Accounts] Created ${data.role}: ${data.email}`);
      } else {
        // Ensure active and password aligns with demo credentials
        user.password = data.password;
        user.isActive = true;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Resolve hotels for staff assignment
    const udaipurHotel =
      (await Hotel.findOne({ slug: 'the-mewar-palace-lake-retreat' })) ||
      (await Hotel.findOne({ 'address.city': 'Udaipur' })) ||
      (await Hotel.findOne());

    const goaHotel =
      (await Hotel.findOne({ slug: 'aguada-cove-beach-resort-villas' })) ||
      (await Hotel.findOne({ 'address.city': 'Goa' })) ||
      udaipurHotel;

    const staffAccounts = [
      {
        name: 'Raghavendra Rathore',
        email: 'staff.udaipur@shreehotels.com',
        password: 'Staff@123',
        role: 'staff',
        phone: '+91 94140 55221',
        assignedHotelId: udaipurHotel?._id,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        isEmailVerified: true,
      },
      {
        name: 'Raghavendra Rathore',
        email: 'staff.udaipur@hotelpro.com',
        password: 'Staff@123',
        role: 'staff',
        phone: '+91 94140 55221',
        assignedHotelId: udaipurHotel?._id,
        isEmailVerified: true,
      },
      {
        name: 'Maria Fernandes',
        email: 'staff.goa@shreehotels.com',
        password: 'Staff@123',
        role: 'staff',
        phone: '+91 98221 66334',
        assignedHotelId: goaHotel?._id,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        isEmailVerified: true,
      },
      {
        name: 'Maria Fernandes',
        email: 'staff.goa@hotelpro.com',
        password: 'Staff@123',
        role: 'staff',
        phone: '+91 98221 66334',
        assignedHotelId: goaHotel?._id,
        isEmailVerified: true,
      },
    ];

    for (const data of staffAccounts) {
      let user = await User.findOne({ email: data.email });
      if (!user) {
        await User.create(data);
        console.log(`[Demo Accounts] Created staff: ${data.email}`);
      } else {
        user.password = data.password;
        user.assignedHotelId = data.assignedHotelId;
        user.isActive = true;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    console.log('[Demo Accounts] Successfully synchronized demo persona accounts:');
    console.log('  Admin:         admin@shreehotels.com         / Admin@123');
    console.log('  Staff Udaipur: staff.udaipur@shreehotels.com / Staff@123');
    console.log('  Staff Goa:     staff.goa@shreehotels.com     / Staff@123');
    console.log('  Guest:         guest@shreehotels.com         / Guest@123');
  } catch (err) {
    console.error('[Demo Accounts] Error syncing demo accounts:', err.message);
  }
};
