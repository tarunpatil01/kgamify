import PropTypes from 'prop-types';
import Footer from '../components/Footer';
import LegalHeader from '../components/LegalHeader';

function TermsOfService({ isDarkMode, $isDarkMode }) {
  const dark = $isDarkMode ?? isDarkMode;
  const textCls = dark ? 'text-gray-200' : 'text-gray-800';
  const subTextCls = dark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <LegalHeader $isDarkMode={dark} isDarkMode={dark} />

  <main className="max-w-6xl mx-auto px-4 sm:px-5 lg:px-6 py-8">
        <h1 className={`text-4xl font-bold mb-6 ${textCls}`}>Terms of Use</h1>

        <div className={`mb-8 ${subTextCls}`}>
          <div className="font-semibold">Effective Date: April 5, 2025</div>
          <div>Owner: Yantrikisoft Pvt. Ltd. (hereinafter ‘Yantrikisoft’)</div>
        </div>

        <p className={`mb-6 leading-relaxed ${textCls}`}>
          Please read these website terms of use carefully before using kGamify website (hereinafter &#39;Website&#39;). These website terms of use (hereinafter &#39;Terms of Use&#39;) govern your access to and use of the website. The website is available for your use only on the condition that you agree to the terms of use set forth below. If you do not agree to all of the terms of use, do not access or use the website. By accessing or using the website, you and the entity you are authorised to represent (hereinafter &#39;You&#39; or &#39;Your&#39;) signify your agreement to be bound by the terms of use.
        </p>

        <section className="space-y-8">
          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>1. Introduction</h2>
            <p className={subTextCls}>
              The Website is provided by kGamify and available only to entities and persons who have reached the age of legal majority and are competent to enter into a legally binding agreement(s) under the applicable law. If You do not qualify, You are not permitted to use the Website.
            </p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>2. Scope of Terms</h2>
            <p className={subTextCls}>
              These Terms of Use govern Your use of the Website and all applications, software and services (collectively known as &quot;Services&quot;) available via the Website, except to the extent that such Services are the subject of a separate agreement. Specific terms or agreements may apply to the use of certain Services and other items provided to You via the Website (&quot;Service Agreement(s)&quot;). Any such Service Agreements will accompany the applicable Services or are listed in association therewith or via a hyperlink associated therewith.
            </p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>3. Modifications</h2>
            <p className={subTextCls}>
              Yantrikisoft, owner of the Website may revise and update these Terms of Use at any time. Your continued usage of the Website after any changes to these Terms of Use will be deemed as acceptance of such changes. Any aspect of the Website may be changed, supplemented, deleted or updated without notice, at the sole discretion of Yantrikisoft. Yantrikisoft may also change or impose fees for products and services provided through the Website at any time, at its sole discretion. Yantrikisoft may establish or change, at any time, general practices and restrictions concerning other Yantrikisoft products and services at its sole discretion.
            </p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>4. User Content</h2>
            <p className={subTextCls}>
              With respect to any individual whose personal information is provided by You to Yantrikisoft, You represent to Yantrikisoft that You have obtained all necessary consents for the processing of such personal information contemplated by the Services.
            </p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>5. Licence and Ownership</h2>
            <p className={subTextCls}>
              Any and all intellectual property rights (&quot;Intellectual Property&quot;) associated with the Website and its contents (the &quot;Content&quot;) are the sole property of Yantrikisoft, its affiliates or third parties. The Content is protected by Intellectual Property and other laws both in India and other countries. Elements of the Website are also protected by trade name, trade secret, unfair competition, and other laws and may not be copied or imitated in whole or in part. All customised graphics, icons, and other items that appear on the Website are trademarks, service marks or trade name (&quot;Marks&quot;) of Yantrikisoft, its affiliates or other entities that have granted Yantrikisoft the right and licence to use such Marks and may not be used or interfered with in any manner without the express written consent of Yantrikisoft. Except as otherwise expressly authorised by these Terms of Use, You may not copy, reproduce, modify, amend, lease, loan, sell and/or create derivative works from, upload, transmit, and/or distribute the Intellectual Property of the Website in any way without Yantrikisoft&#39;s prior written permission or that of an appropriate third party. Except as expressly provided herein, Yantrikisoft does not grant to You any express or implied rights to the Intellectual Property of Yantrikisoft or that of any third party.
            </p>
            <p className={`mt-3 ${subTextCls}`}>
              Yantrikisoft hereby grants You a limited, personal, non-transferable, non-sublicensable, revocable licence to (a) access and use only the Website, Content and Services only in the manner presented by Yantrikisoft, and (b) access and use the Yantrikisoft computer and network services offered within the Website (the &quot;Yantrikisoft Systems&quot;) only in the manner expressly permitted by Yantrikisoft. Except for this limited license, Yantrikisoft does not convey any interest in or to the Yantrikisoft Systems, information or data available via the Yantrikisoft Systems (the &quot;Information&quot;), Content, Services, Website or any other Yantrikisoft property by permitting You to access the Website. Except to the extent required by law or as expressly provided herein, none of the Content and/or Information may be reverse-engineered, modified, amended, reproduced, republished, translated into any language or computer language, re-transmitted in any form or by any means, resold or redistributed without the prior written consent of Yantrikisoft. You may not make, sell, offer for sale, modify, amend, reproduce, display, publicly perform, import, distribute, retransmit or otherwise use the Content in any way unless expressly permitted to do so by Yantrikisoft.
            </p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>6. Restrictions on Use Of The Website</h2>
            <p className={subTextCls}>
              In addition to other restrictions set forth in these Terms of Use, You agree that:
            </p>
            <ul className={`list-disc pl-6 mt-2 space-y-2 ${subTextCls}`}>
              <li>
                You shall not, use, attempt to use, or assist anyone to use or attempt to use, any of the information available on Yantrikisoft’s kGamify website or any of Yantrikisoft’s applications, software, services or work products, to develop or train any machine learning models or related technology;
              </li>
              <li>
                You shall not, use, attempt to use, or assist anyone to use or attempt to use, any robot/ bot, spider, scraper, code, or any other tool, algorithm, process or methodology to access, monitor, mirror, index, or use the website or any of its content;
              </li>
              <li>
                You shall not, use, attempt to use, or assist anyone to use or attempt to use, any form of generative artificial intelligence or other artificial intelligence and machine learning models, algorithms, software, or other tools to use, access, index, modify, reverse engineer, or create derivative works, compilations, or collected works, from any of data or content found on or accessed through Yantrikisoft’s website or any of Yantrikisoft’s applications, software, services or work products; and/or
              </li>
              <li>
                You shall not, attempt to or assist anyone to attempt to reverse engineer, decompile or discover the source code or underlying components of our website, application, software or any other of our services, including our models, algorithms, or systems.
              </li>
            </ul>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>7. Links</h2>
            <p className={subTextCls}>Outbound Links. The Website may contain links to third-party websites and resources (referred to collectively hereinafter as &quot;Linked Sites&quot;). These Linked Sites are provided solely as a convenience to You and not as an endorsement by Yantrikisoft of the content of such Linked Sites. Yantrikisoft makes no representations or warranties regarding the correctness, accuracy, performance or quality of any content, software, service or application found at any Linked Site. Yantrikisoft shall not be responsible for the availability of the Linked Sites or the content or activities of such sites. If You decide to access Linked Sites, You do so at Your own risk. In addition, Your use of Linked Sites is subject to any applicable policies and terms and conditions of use, including but not limited to, the Linked Site&#39;s privacy policy</p>
            <p className={`mt-3 ${subTextCls}`}>Inbound Links. Linking to any page of the Website other than to https://www.kgamify.in through a plain text link is strictly prohibited in the absence of a separate linkage agreement with Yantrikisoft. Any website or other devices that link to https://www.kgamify.in or any page available therein is prohibited from</p>
            <ul className={`list-disc pl-6 mt-2 space-y-2 ${subTextCls}`}>
              <li>replicating Content,</li>
              <li>using a browser or border environment around the Content,</li>
              <li>implying in any fashion that Yantrikisoft or any of its affiliates endorse it or its products,</li>
              <li>misrepresenting any state of facts, including its relationship with Yantrikisoft or any of the Yantrikisoft affiliates,</li>
              <li>presenting false information about Yantrikisoft products or services, and</li>
              <li>using any logo or mark of Yantrikisoft or any of its affiliates, without express written permission from Yantrikisoft</li>
            </ul>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>8. Termination</h2>
            <p className={subTextCls}>You agree that Yantrikisoft, at its sole discretion, may terminate or suspend Your use of the Website, the Yantrikisoft Systems, Information, Services and Content at any time and for any or no reason at its sole discretion, even if access and use continue to be allowed to others. Upon such suspension or termination, You must immediately</p>
            <ul className={`list-disc pl-6 mt-2 space-y-2 ${subTextCls}`}>
              <li>discontinue Your use of the Website, and</li>
              <li>destroy any copies You may have made of any portion of the Content. Accessing the Website, the Yantrikisoft Systems, Information or Services after such termination, suspension or discontinuation shall constitute an act of trespass. Furthermore, You agree that Yantrikisoft shall not be liable to You or to any third party for any termination or suspension of Your access to the Website, the Yantrikisoft Systems, Information and/or the Services.</li>
            </ul>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>9. Disclaimer of Warranties</h2>
            <p className={subTextCls}>Yantrikisoft makes no representations about the results to be obtained from using the Website, the Yantrikisoft systems, the services, the information or the content. The use of same is at your own risk. The website, the Yantrikisoft systems, the information, the services and the content are provided on an &quot;As is&quot; basis. Yantrikisoft, its licensors, and its suppliers, to the fullest extent permitted by law, disclaim all warranties, either express or implied, statutory or otherwise, including but not limited to, the implied warranties of merchantability, non-infringement of third party rights, and fitness for a particular purpose. Yantrikisoft and its affiliates, licensors and suppliers make no representations or warranties concerning the accuracy, completeness, security or timeliness of the content, information or services provided on or through the use of the web site or the Yantrikisoft systems. No information obtained by you from the website shall create any warranty not expressly stated by Yantrikisoft in these Terms of Use.</p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>10. Limitation of Liability</h2>
            <p className={subTextCls}>To the extent permitted by law, in no event shall Yantrikisoft, its affiliates, licensors, suppliers or any third parties mentioned at the website be liable for any incidental, direct, indirect, exemplary, punitive and/or consequential damages, lost profits, and/or damages resulting from lost data or business interruption resulting from the use of and/or inability to use the website, the Yantrikisoft systems, information, services or the content whether based on warranty, contract, tort, delict, or any other legal foundation, and whether or not Yantrikisoft is advised of the possibility of such damages. To the extent permitted by law, the remedies stated for you in these Terms of Use are exclusive and are limited to those expressly provided for herein</p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>11. Compliance With Law including Export Control</h2>
            <p className={subTextCls}>You agree to use the Website in strict compliance with all applicable laws, rulings, and regulations and in a fashion that does not, in the sole judgment of Yantrikisoft, negatively reflect on the goodwill or reputation of Yantrikisoft and You shall take no action which might cause Yantrikisoft to be in breach of any laws, rulings or regulations applicable to Yantrikisoft</p>
            <p className={`mt-3 ${subTextCls}`}>Yantrikisoft and the Website are based in India. Indian jurisdictions control the export of products and information. You agree to comply with all such applicable restrictions and not to export or re-export the Content (including any software or the Services) to countries or persons prohibited under India or other applicable export control laws or regulations. If You access and download the Content (including any software or the Services) or Information, You represent that You are not in a country where such export is prohibited or are not a person or entity to which such export is prohibited. You are solely responsible for compliance with the laws of Your local jurisdiction and any other applicable laws regarding the import, export, or re-export of the Content (including any software or the Services).</p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>12. Changes to Terms</h2>
            <p className={subTextCls}>To the fullest extent permitted by law, these Terms of Use are governed by the internal laws of India and courts in Mumbai, India will have jurisdiction.</p>
          </div>

          <div>
            <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>13. General</h2>
            <p className={subTextCls}>You may not assign these Terms of Use or any of Your interests, rights or obligations under these Terms of Use. If any provision of these Terms of Use shall be found to be invalid by any court having competent jurisdiction, the invalidity of such provision shall not affect the validity of the remaining provisions of these Terms of Use, which shall remain in full force and effect. No waiver of any of these Terms of Use shall be deemed a further or continuing waiver of such term or condition or any other term or condition. You may preserve these Terms of Use in written form by printing them for Your records, and You waive any other requirement for these Terms of Use to be proved by means of a written document.</p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className={`text-xl font-semibold mb-2 ${textCls}`}>Contact Us</h2>
          <p className={subTextCls}>For questions or concerns, reach out to us at:</p>
          <p className={`${textCls} mt-1`}>support@kgamify.in</p>
        </section>
      </main>

      <Footer isDarkMode={dark} $isDarkMode={dark} />
    </div>
  );
}

TermsOfService.propTypes = {
  isDarkMode: PropTypes.bool,
  $isDarkMode: PropTypes.bool,
};

export default TermsOfService;
