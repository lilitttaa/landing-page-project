#!/usr/bin/env tsx

import { ComponentDataValidator } from '../src/lib/componentDataValidator';

async function testValidation() {
  const validator = new ComponentDataValidator();
  
  console.log('🧪 Testing Component Data Validation...\n');

  // Test valid Navbar1 data
  const validNavbarData = {
    logo: {
      url: "#",
      src: "/logo.png",
      alt: "My Logo"
    },
    navLinks: [
      { title: "Home", url: "/" },
      { title: "About", url: "/about" }
    ],
    buttons: [
      { title: "Get Started", variant: "secondary", size: "sm" }
    ]
  };

  console.log('✅ Testing valid Navbar1 data:');
  const navbarResult = validator.validateComponentData('Navbar1', validNavbarData);
  console.log('Valid:', navbarResult.isValid);
  if (navbarResult.errors.length > 0) {
    console.log('Errors:', navbarResult.errors);
  }
  if (navbarResult.warnings && navbarResult.warnings.length > 0) {
    console.log('Warnings:', navbarResult.warnings);
  }

  // Test invalid data (missing required field)
  const invalidNavbarData = {
    logo: {
      src: "/logo.png"
      // missing alt, which is optional but good to test
    },
    navLinks: [
      { title: "Home" } // missing url
    ]
    // missing buttons array entirely
  };

  console.log('\n❌ Testing invalid Navbar1 data:');
  const invalidResult = validator.validateComponentData('Navbar1', invalidNavbarData);
  console.log('Valid:', invalidResult.isValid);
  console.log('Errors:', invalidResult.errors.map(e => `${e.path}: ${e.message}`));

  // Test Layout1 data
  const validLayoutData = {
    tagline: "AI-Powered",
    heading: "Build Beautiful Landing Pages",
    description: "Create stunning landing pages with AI assistance.",
    buttons: [
      { title: "Get Started", variant: "secondary" }
    ],
    image: {
      src: "https://example.com/image.jpg",
      alt: "Hero image"
    }
  };

  console.log('\n✅ Testing valid Layout1 data:');
  const layoutResult = validator.validateComponentData('Layout1', validLayoutData);
  console.log('Valid:', layoutResult.isValid);
  if (layoutResult.errors.length > 0) {
    console.log('Errors:', layoutResult.errors);
  }

  // Test merging with defaults
  console.log('\n🔄 Testing merge with defaults:');
  const partialData = {
    heading: "Custom Heading",
    buttons: [{ title: "Custom Button" }]
  };
  
  const mergedData = validator.mergeWithDefaults('Layout1', partialData);
  console.log('Merged data:', JSON.stringify(mergedData, null, 2));

  console.log('\n🎉 Validation tests completed!');
}

testValidation().catch(console.error);