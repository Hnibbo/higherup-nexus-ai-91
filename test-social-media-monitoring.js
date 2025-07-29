const { socialMediaMonitoringService } = require('./src/services/social/SocialMediaMonitoringService.ts');

async function testSocialMediaMonitoring() {
  console.log('🔍 Testing Social Media Monitoring Service...\n');

  try {
    // Test 1: Start monitoring
    console.log('1. Starting social media monitoring...');
    await socialMediaMonitoringService.startMonitoring(
      ['HigherUp.ai', 'business automation', 'AI marketing'],
      ['HubSpot', 'Marketo', 'ClickFunnels']
    );
    console.log('✅ Monitoring started successfully\n');

    // Test 2: Get brand mentions
    console.log('2. Fetching brand mentions...');
    const mentions = await socialMediaMonitoringService.getBrandMentions('24h');
    console.log(`✅ Found ${mentions.length} brand mentions:`, mentions.slice(0, 2));
    console.log('');

    // Test 3: Analyze sentiment
    console.log('3. Analyzing sentiment...');
    const sentiment = await socialMediaMonitoringService.analyzeSentiment(
      'HigherUp.ai is absolutely amazing! It has revolutionized our business processes.'
    );
    console.log('✅ Sentiment analysis:', sentiment);
    console.log('');

    // Test 4: Track competitors
    console.log('4. Tracking competitors...');
    const competitorTracking = await socialMediaMonitoringService.trackCompetitors([
      'HubSpot', 'Marketo', 'ClickFunnels'
    ]);
    console.log('✅ Competitor tracking:', competitorTracking);
    console.log('');

    // Test 5: Create alert
    console.log('5. Creating social media alert...');
    const alert = await socialMediaMonitoringService.createAlert({
      type: 'mention',
      severity: 'medium',
      message: 'New brand mention detected',
      data: { platform: 'twitter', content: 'Test mention' }
    });
    console.log('✅ Alert created:', alert);
    console.log('');

    // Test 6: Get alerts
    console.log('6. Fetching alerts...');
    const alerts = await socialMediaMonitoringService.getAlerts(false);
    console.log(`✅ Found ${alerts.length} unacknowledged alerts`);
    console.log('');

    // Test 7: Get social ROI
    console.log('7. Calculating social media ROI...');
    const roi = await socialMediaMonitoringService.getSocialROI();
    console.log('✅ Social media ROI:', roi);
    console.log('');

    // Test 8: Get influencer insights
    console.log('8. Getting influencer insights...');
    const influencerInsights = await socialMediaMonitoringService.getInfluencerInsights();
    console.log('✅ Influencer insights:', influencerInsights);
    console.log('');

    // Test 9: Platform-specific mentions
    console.log('9. Getting platform-specific mentions...');
    const twitterMentions = await socialMediaMonitoringService.getBrandMentions('24h', 'twitter');
    console.log(`✅ Twitter mentions: ${twitterMentions.length}`);
    console.log('');

    // Test 10: Stop monitoring
    console.log('10. Stopping monitoring...');
    await socialMediaMonitoringService.stopMonitoring();
    console.log('✅ Monitoring stopped successfully\n');

    console.log('🎉 All Social Media Monitoring tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testSocialMediaMonitoring();