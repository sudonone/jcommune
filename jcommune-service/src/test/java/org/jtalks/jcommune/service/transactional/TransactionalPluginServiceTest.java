/**
 * Copyright (C) 2011  JTalks.org Team
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jtalks.jcommune.service.transactional;

import org.jtalks.common.service.exceptions.NotFoundException;
import org.jtalks.jcommune.model.dao.PluginConfigurationDao;
import org.jtalks.jcommune.model.entity.PluginConfiguration;
import org.jtalks.jcommune.model.entity.PluginConfigurationProperty;
import org.jtalks.jcommune.model.plugins.Plugin;
import org.jtalks.jcommune.service.dto.PluginActivatingDto;
import org.jtalks.jcommune.service.plugins.PluginLoader;
import org.mockito.Mock;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.*;

import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.MockitoAnnotations.initMocks;
import static org.testng.Assert.*;

/**
 * @author Anuar_Nurmakanov
 */
public class TransactionalPluginServiceTest {
    private static final long FAKE_COMPONENT_ID = 25L;

    @Mock
    private PluginConfigurationDao pluginConfigurationDao;
    @Mock
    private PluginLoader pluginLoader;

    private TransactionalPluginService pluginService;

    @BeforeMethod
    public void init() throws Exception {
        initMocks(this);
        pluginService = new TransactionalPluginService(pluginConfigurationDao, pluginLoader);
    }

    @Test
    public void getPluginsShouldReturnRunningInForumPlugins() {
        //GIVEN
        List<Plugin> runningInForumPlugins = Collections.emptyList();
        when(pluginLoader.getPlugins()).thenReturn(runningInForumPlugins);
        //WHEN
        List<Plugin> plugins = pluginService.getPlugins(FAKE_COMPONENT_ID);
        //THEN
        assertEquals(plugins, runningInForumPlugins, "Plugins should be returned by calling plugins loader");
    }

    @Test
    public void getPluginConfigurationShouldFindItInDatabase() throws NotFoundException {
        //GIVEN
        PluginConfiguration expectedConfiguration = new PluginConfiguration();
        String pluginName = "plugin";
        when(pluginConfigurationDao.get(pluginName)).thenReturn(expectedConfiguration);
        //WHEN
        PluginConfiguration actualConfiguration = pluginService.getPluginConfiguration(pluginName, FAKE_COMPONENT_ID);
        //THEN
        assertEquals(actualConfiguration, expectedConfiguration, "Plugin configuration should be retrieved from database.");
    }

    @Test(expectedExceptions = NotFoundException.class)
    public void getPluginConfigurationShouldShowErrorWhenPluginDoesNotExist() throws NotFoundException {
        //GIVEN
        String pluginName = "plugin";
        when(pluginConfigurationDao.get(pluginName)).thenThrow(new NotFoundException());
        //WHEN
        pluginService.getPluginConfiguration(pluginName, FAKE_COMPONENT_ID);
    }

    @Test
    public void updateConfigurationShouldSaveConfigurationProperties() throws NotFoundException {
        //GIVEN
        List<PluginConfigurationProperty> properties = Arrays.asList(new PluginConfigurationProperty());
        PluginConfiguration configuration = new PluginConfiguration("Dummy", false, properties);
        when(pluginLoader.getPlugins()).thenReturn(Arrays.asList((Plugin) new DummyPlugin("Dummy")));
        //WHEN
        pluginService.updateConfiguration(configuration, FAKE_COMPONENT_ID);
        //THEN
        verify(pluginConfigurationDao).updateProperties(properties);
    }

    @Test
    public void updateConfigurationShouldApplyConfigurationForPlugin() throws NotFoundException {
        //GIVEN
        String pluginName = "Should be configured";
        PluginConfiguration configuration = new PluginConfiguration(pluginName, true, Collections.EMPTY_LIST);
        DummyPlugin shouldBeConfiguredPlugin = new DummyPlugin(pluginName);
        DummyPlugin shouldNotBeConfiguredPlugin = new DummyPlugin("Should not be configured");
        when(pluginLoader.getPlugins()).thenReturn(Arrays.asList((Plugin) shouldBeConfiguredPlugin, shouldNotBeConfiguredPlugin));
        //WHEN
        pluginService.updateConfiguration(configuration, FAKE_COMPONENT_ID);
        //THEN
        assertNotNull(shouldBeConfiguredPlugin.configuration, "Plugin should be found by name and reconfigured.");
        assertNull(shouldNotBeConfiguredPlugin.configuration, "All others plugins shouldn't be reconfigured.");
    }

    @Test(expectedExceptions = NotFoundException.class)
    public void updateConfigurationWhenPluginsNotLoadedShouldShowNotFoundError() throws NotFoundException {
        //GIVEN
        PluginConfiguration configuration = new PluginConfiguration();
        when(pluginLoader.getPlugins()).thenReturn(Collections.<Plugin> emptyList());
        //WHEN
        pluginService.updateConfiguration(configuration, FAKE_COMPONENT_ID);
    }

    @Test
    public void updatePluginsEnablingShouldUpdatePluginsEnabling() throws NotFoundException {
        //GIVEN
        String pluginName = "plugin";
        PluginConfiguration pluginConfiguration = new PluginConfiguration();
        pluginConfiguration.setActive(false);
        when(pluginConfigurationDao.get(pluginName)).thenReturn(pluginConfiguration);
        List<PluginActivatingDto> pluginsActivatingDtoList = new ArrayList<>();
        pluginsActivatingDtoList.add(new PluginActivatingDto(pluginName, true));
        //
        when(pluginLoader.getPlugins()).thenReturn(Collections.<Plugin> emptyList());
        //WHEN
        pluginService.updatePluginsActivating(pluginsActivatingDtoList, FAKE_COMPONENT_ID);
        //THEN
        verify(pluginConfigurationDao).saveOrUpdate(pluginConfiguration);
        assertTrue(pluginConfiguration.isActive(), "Plugin must be activated.");
    }

    @Test
    public void updatePluginsEnablingShouldUpdateAllPassedPlugins() throws NotFoundException {
        //GIVEN
        int pluginsCount = 10;
        String pluginName = "plugin";
        PluginConfiguration pluginConfiguration = new PluginConfiguration();
        when(pluginConfigurationDao.get(anyString())).thenReturn(pluginConfiguration);
        List<PluginActivatingDto> pluginsActivatingDtoList = new ArrayList<>();
        for (int i=0; i< pluginsCount; i++) {
            pluginsActivatingDtoList.add(new PluginActivatingDto(pluginName + i, true));
        }
        //
        when(pluginLoader.getPlugins()).thenReturn(Collections.<Plugin> emptyList());
        //WHEN
        pluginService.updatePluginsActivating(pluginsActivatingDtoList, FAKE_COMPONENT_ID);
        //THEN
        verify(pluginConfigurationDao, times(pluginsCount)).saveOrUpdate(pluginConfiguration);
    }

    /**
     * Created for tests plugin.
     */
    private static final class DummyPlugin implements Plugin {
        PluginConfiguration configuration;
        String name;

        DummyPlugin(String name) {
            this.name = name;
        }

        @Override
        public boolean supportsJCommuneVersion(String version) {
            return false;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public List getConfiguration() {
            return null;
        }

        @Override
        public List<PluginConfigurationProperty> getDefaultConfiguration() {
            return null;
        }

        @Override
        public void configure(PluginConfiguration configuration) {
            this.configuration = configuration;
        }

        @Override
        public State getState() {
            return null;
        }

        @Override
        public boolean isEnabled() {
            return false;
        }


    }
}